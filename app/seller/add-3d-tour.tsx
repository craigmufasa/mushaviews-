import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Box, Plus, X, Camera, Link, Wifi, WifiOff, Upload, AlertCircle, Eye, Maximize2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { usePropertyStore } from '@/store/property-store';
import { Property, TourRoom, DeviceCapability } from '@/types/property';

export default function Add3DTourScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    properties, 
    updateProperty, 
    isLoading,
    isOfflineMode,
    pendingUploads
  } = usePropertyStore();
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [rooms, setRooms] = useState<TourRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Partial<TourRoom>>({
    name: '',
    panoramaImage: '',
    connections: [],
  });
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [enableVRMode, setEnableVRMode] = useState(true);
  const [optimizeForLowEnd, setOptimizeForLowEnd] = useState(false);
  const [showPanoramaCapture, setShowPanoramaCapture] = useState(false);

  // Network status
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Filter properties owned by the current user
      const userProperties = properties.filter(p => p.sellerId === user.id);
      setSellerProperties(userProperties);
    }
  }, [user, properties]);

  const handlePropertySelect = (id: string) => {
    const property = sellerProperties.find(p => p.id === id);
    setSelectedProperty(property || null);
    setPropertyId(id);
    
    // If property already has tour rooms, load them
    if (property?.tourRooms) {
      setRooms(property.tourRooms);
    } else {
      setRooms([]);
    }
  };

  const pickPanoramaImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: imageQuality === 'high' ? 1.0 : imageQuality === 'medium' ? 0.8 : 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentRoom({
          ...currentRoom,
          panoramaImage: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick panorama image');
    }
  };

  const capturePanoramaImage = async () => {
    // For now, we'll simulate panorama capture with a placeholder
    // In a real implementation, this would use a 360 camera library
    const mockPanoramaUri = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=960&fit=crop';
    setCurrentRoom({
      ...currentRoom,
      panoramaImage: mockPanoramaUri,
    });
    setShowPanoramaCapture(false);
  };

  const addRoom = () => {
    if (!currentRoom.name || !currentRoom.panoramaImage) {
      Alert.alert('Error', 'Please provide a room name and panorama image');
      return;
    }

    const supportedDevices: DeviceCapability[] = optimizeForLowEnd ? ['low', 'medium', 'high'] : ['medium', 'high'];

    const newRoom: TourRoom = {
      id: Date.now().toString(),
      name: currentRoom.name,
      panoramaImage: currentRoom.panoramaImage,
      connections: currentRoom.connections || [],
      description: currentRoom.description,
      isMain: rooms.length === 0, // First room is main by default
      features: [],
      optimizedForLowEnd: optimizeForLowEnd,
      imageQuality,
      enableVRMode,
      supportedDevices,
    };

    setRooms([...rooms, newRoom]);
    setCurrentRoom({
      name: '',
      panoramaImage: '',
      connections: [],
      description: '',
    });
    setShowRoomForm(false);
  };

  const removeRoom = (id: string) => {
    // Remove this room from all other rooms' connections
    const updatedRooms = rooms.map(room => ({
      ...room,
      connections: room.connections.filter(connId => connId !== id),
    }));
    
    // Then remove the room itself
    const filteredRooms = updatedRooms.filter(room => room.id !== id);
    
    // If we removed the main room, make the first remaining room main
    if (filteredRooms.length > 0) {
      const removedRoom = rooms.find(r => r.id === id);
      if (removedRoom?.isMain) {
        filteredRooms[0].isMain = true;
      }
    }
    
    setRooms(filteredRooms);
  };

  const toggleRoomConnection = (roomId: string) => {
    const connections = currentRoom.connections || [];
    if (connections.includes(roomId)) {
      setCurrentRoom({
        ...currentRoom,
        connections: connections.filter(id => id !== roomId),
      });
    } else {
      setCurrentRoom({
        ...currentRoom,
        connections: [...connections, roomId],
      });
    }
  };

  const setMainRoom = (roomId: string) => {
    const updatedRooms = rooms.map(room => ({
      ...room,
      isMain: room.id === roomId,
    }));
    setRooms(updatedRooms);
  };

  const handleSubmit = async () => {
    if (!selectedProperty) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    if (rooms.length === 0) {
      Alert.alert('Error', 'Please add at least one room for the 3D tour');
      return;
    }

    // Show offline warning if applicable
    if (!isOnline || isOfflineMode) {
      Alert.alert(
        'Offline Mode',
        'Your 3D tour will be saved locally and uploaded when you come back online.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Offline', onPress: () => performSubmit() }
        ]
      );
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    try {
      await updateProperty(selectedProperty!.id, {
        has3DTour: true,
        tourRooms: rooms,
        tourSettings: {
          enableVRMode,
          optimizeForLowEnd: optimizeForLowEnd,
          imageQuality,
          supportOfflineViewing: true,
        },
      });

      const successMessage = isOfflineMode || !isOnline 
        ? '3D tour saved offline successfully. It will be uploaded when you come back online.'
        : '3D tour added successfully';

      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding 3D tour:', error);
      Alert.alert('Error', 'Failed to add 3D tour');
    }
  };

  if (showPanoramaCapture) {
    return (
      <SafeAreaView style={styles.cameraContainer} edges={['top']}>
        <Stack.Screen options={{ title: 'Capture Panorama' }} />
        
        <View style={styles.cameraHeader}>
          <TouchableOpacity onPress={() => setShowPanoramaCapture(false)} style={styles.closeButton}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Capture 360° Panorama</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <View style={styles.panoramaGuide}>
              <Text style={styles.panoramaGuideText}>
                Slowly rotate 360° to capture the entire room
              </Text>
              <View style={styles.panoramaIndicator} />
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={capturePanoramaImage}
              >
                <Camera size={32} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.cameraInstructions}>
          <Text style={styles.instructionText}>
            • Hold your device steady and rotate slowly
          </Text>
          <Text style={styles.instructionText}>
            • Keep the camera level for best results
          </Text>
          <Text style={styles.instructionText}>
            • Ensure good lighting throughout the room
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Add 3D Tour' }} />

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          {isOnline && !isOfflineMode ? (
            <Wifi size={16} color={colors.success} />
          ) : (
            <WifiOff size={16} color={colors.warning} />
          )}
          <Text style={styles.statusText}>
            {isOnline && !isOfflineMode ? 'Online' : 'Offline Mode'}
          </Text>
        </View>
        
        {pendingUploads.length > 0 && (
          <View style={styles.pendingIndicator}>
            <Upload size={16} color={colors.warning} />
            <Text style={styles.pendingText}>{pendingUploads.length} Pending</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Offline warning */}
        {(!isOnline || isOfflineMode) && (
          <View style={styles.offlineWarning}>
            <AlertCircle size={20} color={colors.warning} />
            <Text style={styles.offlineWarningText}>
              3D tours will be saved offline and uploaded when connection is restored
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Property</Text>
          <Text style={styles.sectionDescription}>
            Choose a property to add a 3D tour
          </Text>

          {sellerProperties.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertiesScroll}>
              {sellerProperties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.propertyCard,
                    propertyId === property.id && styles.selectedPropertyCard,
                  ]}
                  onPress={() => handlePropertySelect(property.id)}
                >
                  <Image
                    source={{ uri: property.images[0] }}
                    style={styles.propertyImage}
                  />
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyAddress} numberOfLines={1}>
                      {property.address}
                    </Text>
                    <Text style={styles.propertyDetails}>
                      {property.beds} bd • {property.baths} ba • {property.sqm.toLocaleString()} sqm
                    </Text>
                    {property.has3DTour && (
                      <View style={styles.tourBadge}>
                        <Box size={12} color={colors.secondary} />
                        <Text style={styles.tourBadgeText}>Has Tour</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPropertiesContainer}>
              <Text style={styles.emptyPropertiesText}>
                You don't have any properties yet. Add a property first.
              </Text>
              <TouchableOpacity
                style={styles.addPropertyButton}
                onPress={() => router.push('/seller/add-property')}
              >
                <Text style={styles.addPropertyButtonText}>Add Property</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {selectedProperty && (
          <>
            {/* Tour Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tour Settings</Text>
              
              <View style={styles.settingsGrid}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Image Quality:</Text>
                  <View style={styles.qualityButtons}>
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                      <TouchableOpacity
                        key={quality}
                        style={[
                          styles.qualityButton,
                          imageQuality === quality && styles.activeQualityButton
                        ]}
                        onPress={() => setImageQuality(quality)}
                      >
                        <Text style={[
                          styles.qualityButtonText,
                          imageQuality === quality && styles.activeQualityButtonText
                        ]}>
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.settingItem}>
                  <TouchableOpacity 
                    style={styles.toggleSetting}
                    onPress={() => setEnableVRMode(!enableVRMode)}
                  >
                    <Eye size={20} color={enableVRMode ? colors.primary : colors.textLight} />
                    <Text style={[
                      styles.toggleText,
                      enableVRMode && styles.activeToggleText
                    ]}>
                      Enable VR Mode
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.settingItem}>
                  <TouchableOpacity 
                    style={styles.toggleSetting}
                    onPress={() => setOptimizeForLowEnd(!optimizeForLowEnd)}
                  >
                    <Box size={20} color={optimizeForLowEnd ? colors.primary : colors.textLight} />
                    <Text style={[
                      styles.toggleText,
                      optimizeForLowEnd && styles.activeToggleText
                    ]}>
                      Optimize for Low-End Devices
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.settingsNote}>
                {optimizeForLowEnd 
                  ? 'Tour will be optimized for devices with limited processing power and slower connections'
                  : 'Tour will prioritize visual quality and features'
                }
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tour Rooms</Text>
                <TouchableOpacity
                  style={styles.addRoomButton}
                  onPress={() => setShowRoomForm(true)}
                >
                  <Plus size={20} color={colors.primary} />
                  <Text style={styles.addRoomButtonText}>Add Room</Text>
                </TouchableOpacity>
              </View>

              {rooms.length > 0 ? (
                <View style={styles.roomsList}>
                  {rooms.map((room) => (
                    <View key={room.id} style={styles.roomItem}>
                      <Image
                        source={{ uri: room.panoramaImage }}
                        style={styles.roomThumbnail}
                      />
                      <View style={styles.roomInfo}>
                        <View style={styles.roomHeader}>
                          <Text style={styles.roomName}>{room.name}</Text>
                          {room.isMain && (
                            <View style={styles.mainRoomBadge}>
                              <Text style={styles.mainRoomBadgeText}>MAIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roomConnections}>
                          Connected to: {room.connections.length} rooms
                        </Text>
                        {room.description && (
                          <Text style={styles.roomDescription} numberOfLines={2}>
                            {room.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.roomActions}>
                        {!room.isMain && (
                          <TouchableOpacity
                            style={styles.setMainButton}
                            onPress={() => setMainRoom(room.id)}
                          >
                            <Text style={styles.setMainButtonText}>Set Main</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.removeRoomButton}
                          onPress={() => removeRoom(room.id)}
                        >
                          <X size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyRoomsContainer}>
                  <Box size={40} color={colors.textLight} />
                  <Text style={styles.emptyRoomsText}>
                    No rooms added yet. Add rooms to create a 3D tour.
                  </Text>
                </View>
              )}
            </View>

            {showRoomForm && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add New Room</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Room Name*</Text>
                  <TextInput
                    style={styles.input}
                    value={currentRoom.name}
                    onChangeText={(text) => setCurrentRoom({ ...currentRoom, name: text })}
                    placeholder="e.g. Living Room, Kitchen, Bedroom"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Room Description (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={currentRoom.description}
                    onChangeText={(text) => setCurrentRoom({ ...currentRoom, description: text })}
                    placeholder="Describe this room and its features"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>360° Panorama Image*</Text>
                  {currentRoom.panoramaImage ? (
                    <View style={styles.panoramaContainer}>
                      <Image
                        source={{ uri: currentRoom.panoramaImage }}
                        style={styles.panoramaPreview}
                      />
                      <View style={styles.panoramaActions}>
                        <TouchableOpacity
                          style={styles.changePanoramaButton}
                          onPress={pickPanoramaImage}
                        >
                          <Text style={styles.changePanoramaButtonText}>Change Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.capturePanoramaButton}
                          onPress={capturePanoramaImage}
                        >
                          <Camera size={16} color="white" />
                          <Text style={styles.capturePanoramaButtonText}>Capture New</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.panoramaOptions}>
                      <TouchableOpacity
                        style={styles.pickPanoramaButton}
                        onPress={pickPanoramaImage}
                      >
                        <Maximize2 size={24} color={colors.primary} />
                        <Text style={styles.pickPanoramaButtonText}>
                          Select from Gallery
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.capturePanoramaButtonLarge}
                        onPress={capturePanoramaImage}
                      >
                        <Camera size={24} color="white" />
                        <Text style={styles.capturePanoramaButtonLargeText}>
                          Capture 360° Panorama
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={styles.helperText}>
                    Use a 360° panoramic image for the best virtual tour experience.
                    {optimizeForLowEnd && ' Lower quality images will load faster on slow connections.'}
                  </Text>
                </View>

                {rooms.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Connect to Other Rooms</Text>
                    <View style={styles.connectionsContainer}>
                      {rooms.map((room) => (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.connectionItem,
                            currentRoom.connections?.includes(room.id) && styles.connectionItemSelected,
                          ]}
                          onPress={() => toggleRoomConnection(room.id)}
                        >
                          <Text
                            style={[
                              styles.connectionItemText,
                              currentRoom.connections?.includes(room.id) && styles.connectionItemTextSelected,
                            ]}
                          >
                            {room.name}
                          </Text>
                          {room.isMain && (
                            <View style={styles.connectionMainBadge}>
                              <Text style={styles.connectionMainBadgeText}>MAIN</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.helperText}>
                      Select which rooms visitors can navigate to from this room
                    </Text>
                  </View>
                )}

                <View style={styles.roomFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowRoomForm(false);
                      setCurrentRoom({
                        name: '',
                        panoramaImage: '',
                        connections: [],
                        description: '',
                      });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addRoom}
                  >
                    <Text style={styles.addButtonText}>Add Room</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Upload size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {(!isOnline || isOfflineMode) ? 'Save 3D Tour Offline' : 'Save 3D Tour'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    padding: 8,
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  camera: {
    flex: 1,
    backgroundColor: '#333',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  panoramaGuide: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
  },
  panoramaGuideText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  panoramaIndicator: {
    width: 100,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  cameraControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  cameraInstructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warning,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  offlineWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  settingsGrid: {
    gap: 16,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeQualityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  activeQualityButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  toggleSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textLight,
  },
  activeToggleText: {
    color: colors.primary,
    fontWeight: '500',
  },
  settingsNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  propertiesScroll: {
    marginBottom: 8,
  },
  propertyCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPropertyCard: {
    borderColor: colors.primary,
  },
  propertyImage: {
    width: '100%',
    height: 120,
  },
  propertyInfo: {
    padding: 8,
  },
  propertyAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 12,
    color: colors.textLight,
  },
  tourBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  tourBadgeText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '500',
  },
  emptyPropertiesContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyPropertiesText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  addPropertyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addPropertyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addRoomButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  roomsList: {
    gap: 12,
  },
  roomItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomThumbnail: {
    width: 80,
    height: 80,
  },
  roomInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  mainRoomBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainRoomBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  roomConnections: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  roomActions: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  setMainButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  setMainButtonText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  removeRoomButton: {
    padding: 4,
  },
  emptyRoomsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyRoomsText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  panoramaContainer: {
    marginBottom: 12,
  },
  panoramaPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  panoramaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  changePanoramaButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  changePanoramaButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  capturePanoramaButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  capturePanoramaButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  panoramaOptions: {
    gap: 12,
  },
  pickPanoramaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    gap: 8,
  },
  pickPanoramaButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  capturePanoramaButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 24,
    gap: 8,
  },
  capturePanoramaButtonLargeText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  connectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  connectionItem: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  connectionItemText: {
    fontSize: 14,
    color: colors.text,
  },
  connectionItemTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  connectionMainBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  connectionMainBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
  },
  roomFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});