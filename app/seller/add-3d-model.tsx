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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Box, Plus, X, Camera, Upload, FileInput, Info, MapPin, Home, Wifi, WifiOff, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { usePropertyStore } from '@/store/property-store';
import { Property, Model3D, Hotspot, HotspotType, DeviceCapability } from '@/types/property';

export default function Add3DModelScreen() {
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
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [modelFormat, setModelFormat] = useState<Model3D['format']>('3d-model/gltf');
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [scale, setScale] = useState('1.0');
  const [textureInfo, setTextureInfo] = useState('');
  const [hasEmbeddedTextures, setHasEmbeddedTextures] = useState(true);
  const [textureFiles, setTextureFiles] = useState<string[]>([]);
  const [showTextureHelp, setShowTextureHelp] = useState(false);
  const [optimizeForLowEnd, setOptimizeForLowEnd] = useState(true);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Hotspots
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showAddHotspot, setShowAddHotspot] = useState(false);
  const [hotspotTitle, setHotspotTitle] = useState('');
  const [hotspotDescription, setHotspotDescription] = useState('');
  const [hotspotType, setHotspotType] = useState<HotspotType>('info');
  const [hotspotPosition, setHotspotPosition] = useState({ x: 0, y: 0, z: 0 });
  const [linkedRoomId, setLinkedRoomId] = useState<string | undefined>(undefined);

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

  // Auto-detect if format is GLB (which typically has embedded textures)
  useEffect(() => {
    if (modelFile) {
      const isGlb = modelFile.toLowerCase().endsWith('.glb');
      if (isGlb) {
        setModelFormat('3d-model/glb');
        setHasEmbeddedTextures(true);
      }
    }
  }, [modelFile]);

  const handlePropertySelect = (id: string) => {
    const property = sellerProperties.find(p => p.id === id);
    setSelectedProperty(property || null);
    setPropertyId(id);
  };

  const pickThumbnailImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: compressionLevel === 'high' ? 1.0 : compressionLevel === 'medium' ? 0.8 : 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setThumbnailImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick thumbnail image');
    }
  };

  const pickModelFile = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll simulate file picking
        Alert.alert(
          'Model File Selection',
          'In a production app, this would open a file picker for 3D model files (.gltf, .glb, .obj, .usdz)',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate GLB File', 
              onPress: () => {
                setModelFile('https://example.com/model.glb');
                setModelFormat('3d-model/glb');
                setHasEmbeddedTextures(true);
              }
            },
            { 
              text: 'Simulate GLTF File', 
              onPress: () => {
                setModelFile('https://example.com/model.gltf');
                setModelFormat('3d-model/gltf');
                setHasEmbeddedTextures(false);
              }
            }
          ]
        );
        return;
      }
      
      // Use ImagePicker as a fallback for document picking on native
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setModelFile(file.uri);
        
        // Try to determine format from file extension
        const fileName = file.uri.toLowerCase();
        if (fileName.endsWith('.gltf')) {
          setModelFormat('3d-model/gltf');
          setHasEmbeddedTextures(false);
        } else if (fileName.endsWith('.glb')) {
          setModelFormat('3d-model/glb');
          setHasEmbeddedTextures(true);
        } else if (fileName.endsWith('.obj')) {
          setModelFormat('3d-model/obj');
          setHasEmbeddedTextures(false);
        } else if (fileName.endsWith('.usdz')) {
          setModelFormat('3d-model/usdz');
          setHasEmbeddedTextures(true);
        }
      }
    } catch (error) {
      console.error('Error picking model file:', error);
      Alert.alert('Error', 'Failed to pick model file');
    }
  };

  const pickTextureFiles = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Texture Selection', 'Texture file picking is not fully supported in web preview.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: compressionLevel === 'high' ? 1.0 : compressionLevel === 'medium' ? 0.8 : 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const textureUris = result.assets.map(asset => asset.uri);
        setTextureFiles([...textureFiles, ...textureUris]);
      }
    } catch (error) {
      console.error('Error picking texture files:', error);
      Alert.alert('Error', 'Failed to pick texture files');
    }
  };

  const removeTextureFile = (index: number) => {
    const updatedTextures = [...textureFiles];
    updatedTextures.splice(index, 1);
    setTextureFiles(updatedTextures);
  };
  
  // Add a new hotspot
  const addHotspot = () => {
    if (!hotspotTitle) {
      Alert.alert('Error', 'Please enter a title for the hotspot');
      return;
    }
    
    const newHotspot: Hotspot = {
      id: Date.now().toString(),
      type: hotspotType,
      title: hotspotTitle,
      description: hotspotDescription,
      position: hotspotPosition,
      linkedRoomId: hotspotType === 'room' ? linkedRoomId : undefined
    };
    
    setHotspots([...hotspots, newHotspot]);
    
    // Reset form
    setHotspotTitle('');
    setHotspotDescription('');
    setHotspotType('info');
    setHotspotPosition({ x: 0, y: 0, z: 0 });
    setLinkedRoomId(undefined);
    setShowAddHotspot(false);
  };
  
  // Remove a hotspot
  const removeHotspot = (id: string) => {
    setHotspots(hotspots.filter(hotspot => hotspot.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedProperty) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    if (!modelName) {
      Alert.alert('Error', 'Please enter a name for the 3D model');
      return;
    }

    if (!modelFile) {
      Alert.alert('Error', 'Please select a 3D model file');
      return;
    }

    if (!thumbnailImage) {
      Alert.alert('Error', 'Please select a thumbnail image');
      return;
    }

    // Show offline warning if applicable
    if (!isOnline || isOfflineMode) {
      Alert.alert(
        'Offline Mode',
        'Your 3D model will be saved locally and uploaded when you come back online.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Offline', onPress: () => submitModel() }
        ]
      );
    } else {
      // For GLTF format, check if textures are needed but not provided
      if (modelFormat === '3d-model/gltf' && !hasEmbeddedTextures && textureFiles.length === 0) {
        Alert.alert(
          'Missing Textures',
          'You indicated that your GLTF model has external textures, but no texture files were selected. Do you want to continue anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => submitModel() }
          ]
        );
      } else {
        submitModel();
      }
    }
  };

  const submitModel = async () => {
    try {
      if (!selectedProperty) {
        Alert.alert('Error', 'Please select a property');
        return;
      }

      // Create texture info string
      let textureInfoString = textureInfo;
      if (!textureInfoString && textureFiles.length > 0) {
        textureInfoString = `${textureFiles.length} texture files`;
      } else if (!textureInfoString && hasEmbeddedTextures) {
        textureInfoString = 'Embedded textures';
      }

      // Add optimization info
      if (optimizeForLowEnd) {
        textureInfoString += ' • Optimized for low-end devices';
      }

      const supportedDevices: DeviceCapability[] = optimizeForLowEnd ? ['low', 'medium', 'high'] : ['medium', 'high'];

      // Create the 3D model object with enhanced properties
      const newModel: Model3D = {
        id: Date.now().toString(),
        name: modelName,
        description: modelDescription || undefined,
        modelUrl: modelFile || '',
        thumbnailUrl: thumbnailImage || '',
        format: modelFormat,
        scale: parseFloat(scale) || 1.0,
        textureInfo: textureInfoString || undefined,
        textureFiles: textureFiles.length > 0 ? textureFiles : undefined,
        hasEmbeddedTextures: hasEmbeddedTextures || undefined,
        hotspots: hotspots.length > 0 ? hotspots : undefined,
        // Enhanced properties for optimization
        optimizedForLowEnd: optimizeForLowEnd,
        compressionLevel: compressionLevel,
        supportedDevices: supportedDevices,
        estimatedFileSize: modelFormat === '3d-model/glb' ? 'Large (embedded textures)' : 'Medium',
        renderingHints: {
          maxPolygons: optimizeForLowEnd ? 10000 : 50000,
          textureResolution: compressionLevel === 'low' ? 512 : compressionLevel === 'medium' ? 1024 : 2048,
          enableShadows: !optimizeForLowEnd,
          enableReflections: compressionLevel === 'high',
        }
      };

      // Update the property with the new 3D model
      const existingModels = selectedProperty.models3D || [];
      
      await updateProperty(selectedProperty.id, {
        has3DModel: true,
        models3D: [...existingModels, newModel],
      });

      const successMessage = isOfflineMode || !isOnline 
        ? '3D model saved offline successfully. It will be uploaded when you come back online.'
        : '3D model added successfully';

      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding 3D model:', error);
      Alert.alert('Error', 'Failed to add 3D model');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Add 3D Model' }} />

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
              3D models will be saved offline and uploaded when connection is restored
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Property</Text>
          <Text style={styles.sectionDescription}>
            Choose a property to add a 3D model
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
                    {property.has3DModel && (
                      <View style={styles.modelBadge}>
                        <Box size={12} color={colors.primary} />
                        <Text style={styles.modelBadgeText}>Has 3D Model</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPropertiesContainer}>
              <Text style={styles.emptyPropertiesText}>
                You do not have any properties yet. Add a property first.
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3D Model Details</Text>
            
            {/* Optimization settings */}
            <View style={styles.optimizationSection}>
              <Text style={styles.optimizationTitle}>Performance Optimization</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Optimize for low-end devices</Text>
                <Switch
                  value={optimizeForLowEnd}
                  onValueChange={setOptimizeForLowEnd}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={optimizeForLowEnd ? colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.compressionContainer}>
                <Text style={styles.compressionLabel}>Compression Level:</Text>
                <View style={styles.compressionButtons}>
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.compressionButton,
                        compressionLevel === level && styles.activeCompressionButton
                      ]}
                      onPress={() => setCompressionLevel(level)}
                    >
                      <Text style={[
                        styles.compressionButtonText,
                        compressionLevel === level && styles.activeCompressionButtonText
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <Text style={styles.optimizationNote}>
                {optimizeForLowEnd 
                  ? 'Model will be optimized for devices with limited processing power'
                  : 'Model will prioritize visual quality over performance'
                }
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Name*</Text>
              <TextInput
                style={styles.input}
                value={modelName}
                onChangeText={setModelName}
                placeholder="e.g. House Interior, Kitchen Model"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={modelDescription}
                onChangeText={setModelDescription}
                placeholder="Describe what this 3D model shows"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model File (GLB or GLTF recommended)*</Text>
              {modelFile ? (
                <View style={styles.fileContainer}>
                  <View style={styles.fileInfo}>
                    <Box size={24} color={colors.primary} />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {modelFile.split('/').pop() || 'model file'}
                      </Text>
                      <Text style={styles.fileFormat}>{modelFormat.replace('3d-model/', '').toUpperCase()} Format</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={pickModelFile}
                  >
                    <Text style={styles.changeFileButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickFileButton}
                  onPress={pickModelFile}
                >
                  <FileInput size={24} color={colors.primary} />
                  <Text style={styles.pickFileButtonText}>
                    Select 3D Model File (GLB or GLTF recommended)
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helperText}>
                GLB files include textures. GLTF files may require separate texture files.
                {optimizeForLowEnd && ' Low-poly models recommended for better performance.'}
              </Text>
            </View>
            
            {/* Enhanced texture settings */}
            {modelFile && (
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Texture Settings</Text>
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => setShowTextureHelp(!showTextureHelp)}
                  >
                    <Info size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                
                {showTextureHelp && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      • GLB files typically have textures embedded inside them{'\n'}
                      • GLTF files often reference external texture image files{'\n'}
                      • For best results with GLTF, upload the texture files separately{'\n'}
                      • Lower compression reduces file size but may affect quality
                    </Text>
                  </View>
                )}
                
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Model has embedded textures</Text>
                  <Switch
                    value={hasEmbeddedTextures}
                    onValueChange={setHasEmbeddedTextures}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={hasEmbeddedTextures ? colors.primary : '#f4f3f4'}
                  />
                </View>
                
                {!hasEmbeddedTextures && (
                  <View style={styles.textureFilesContainer}>
                    <Text style={styles.textureFilesLabel}>Texture Files</Text>
                    
                    {textureFiles.length > 0 ? (
                      <View style={styles.textureFilesList}>
                        {textureFiles.map((texture, index) => (
                          <View key={index} style={styles.textureFileItem}>
                            <Image 
                              source={{ uri: texture }} 
                              style={styles.texturePreview} 
                            />
                            <Text style={styles.textureFileName} numberOfLines={1}>
                              {texture.split('/').pop() || `texture_${index}`}
                            </Text>
                            <TouchableOpacity
                              style={styles.removeTextureButton}
                              onPress={() => removeTextureFile(index)}
                            >
                              <X size={16} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    
                    <TouchableOpacity
                      style={styles.addTextureButton}
                      onPress={pickTextureFiles}
                    >
                      <Plus size={16} color={colors.primary} />
                      <Text style={styles.addTextureButtonText}>
                        {textureFiles.length > 0 ? 'Add More Textures' : 'Add Texture Files'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Texture Information (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={textureInfo}
                    onChangeText={setTextureInfo}
                    placeholder="e.g. PBR materials, 4K textures"
                    multiline
                  />
                </View>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thumbnail Image*</Text>
              {thumbnailImage ? (
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: thumbnailImage }}
                    style={styles.thumbnailPreview}
                  />
                  <TouchableOpacity
                    style={styles.changeThumbnailButton}
                    onPress={pickThumbnailImage}
                  >
                    <Text style={styles.changeThumbnailButtonText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickThumbnailButton}
                  onPress={pickThumbnailImage}
                >
                  <Camera size={24} color={colors.primary} />
                  <Text style={styles.pickThumbnailButtonText}>
                    Select Thumbnail Image
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Scale Factor (optional)</Text>
              <TextInput
                style={styles.input}
                value={scale}
                onChangeText={setScale}
                placeholder="1.0"
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Use this to adjust the size of your model in the viewer
              </Text>
            </View>
            
            {/* Enhanced hotspots section */}
            <View style={styles.hotspotsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>Interactive Hotspots</Text>
                <TouchableOpacity 
                  style={styles.addHotspotButton}
                  onPress={() => setShowAddHotspot(!showAddHotspot)}
                >
                  <Text style={styles.addHotspotButtonText}>
                    {showAddHotspot ? 'Cancel' : 'Add Hotspot'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.hotspotDescription}>
                Add interactive points of interest to your 3D model for enhanced user experience
              </Text>
              
              {/* Hotspot form */}
              {showAddHotspot && (
                <View style={styles.hotspotForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hotspot Title*</Text>
                    <TextInput
                      style={styles.input}
                      value={hotspotTitle}
                      onChangeText={setHotspotTitle}
                      placeholder="e.g. Kitchen Island, Master Bedroom"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={hotspotDescription}
                      onChangeText={setHotspotDescription}
                      placeholder="Describe this point of interest"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hotspot Type</Text>
                    <View style={styles.hotspotTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.hotspotTypeButton,
                          hotspotType === 'info' && styles.activeHotspotTypeButton
                        ]}
                        onPress={() => setHotspotType('info')}
                      >
                        <Info size={16} color={hotspotType === 'info' ? 'white' : colors.text} />
                        <Text style={[
                          styles.hotspotTypeText,
                          hotspotType === 'info' && styles.activeHotspotTypeText
                        ]}>
                          Information
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.hotspotTypeButton,
                          hotspotType === 'room' && styles.activeHotspotTypeButton
                        ]}
                        onPress={() => setHotspotType('room')}
                      >
                        <Home size={16} color={hotspotType === 'room' ? 'white' : colors.text} />
                        <Text style={[
                          styles.hotspotTypeText,
                          hotspotType === 'room' && styles.activeHotspotTypeText
                        ]}>
                          Room Link
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.hotspotTypeButton,
                          hotspotType === 'feature' && styles.activeHotspotTypeButton
                        ]}
                        onPress={() => setHotspotType('feature')}
                      >
                        <MapPin size={16} color={hotspotType === 'feature' ? 'white' : colors.text} />
                        <Text style={[
                          styles.hotspotTypeText,
                          hotspotType === 'feature' && styles.activeHotspotTypeText
                        ]}>
                          Feature
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Position inputs */}
                  <View style={styles.positionContainer}>
                    <Text style={styles.label}>Position (x, y, z)</Text>
                    <View style={styles.positionInputs}>
                      <View style={styles.positionInput}>
                        <Text style={styles.positionLabel}>X:</Text>
                        <TextInput
                          style={styles.positionTextInput}
                          value={hotspotPosition.x.toString()}
                          onChangeText={(value) => setHotspotPosition({
                            ...hotspotPosition,
                            x: parseFloat(value) || 0
                          })}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.positionInput}>
                        <Text style={styles.positionLabel}>Y:</Text>
                        <TextInput
                          style={styles.positionTextInput}
                          value={hotspotPosition.y.toString()}
                          onChangeText={(value) => setHotspotPosition({
                            ...hotspotPosition,
                            y: parseFloat(value) || 0
                          })}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.positionInput}>
                        <Text style={styles.positionLabel}>Z:</Text>
                        <TextInput
                          style={styles.positionTextInput}
                          value={hotspotPosition.z.toString()}
                          onChangeText={(value) => setHotspotPosition({
                            ...hotspotPosition,
                            z: parseFloat(value) || 0
                          })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <Text style={styles.helperText}>
                      In a production app, you would place hotspots visually on the 3D model
                    </Text>
                  </View>
                  
                  {/* Room link selector (only for room type) */}
                  {hotspotType === 'room' && selectedProperty && selectedProperty.tourRooms && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Link to Room</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomLinkScroll}>
                        {selectedProperty.tourRooms.map((room) => (
                          <TouchableOpacity
                            key={room.id}
                            style={[
                              styles.roomLinkButton,
                              linkedRoomId === room.id && styles.activeRoomLinkButton
                            ]}
                            onPress={() => setLinkedRoomId(room.id)}
                          >
                            <Text style={[
                              styles.roomLinkText,
                              linkedRoomId === room.id && styles.activeRoomLinkText
                            ]}>
                              {room.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      {selectedProperty.tourRooms.length === 0 && (
                        <Text style={styles.noRoomsText}>
                          No 3D tour rooms available. Add a 3D tour first to link rooms.
                        </Text>
                      )}
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={styles.addHotspotSubmitButton}
                    onPress={addHotspot}
                  >
                    <Plus size={16} color="white" />
                    <Text style={styles.addHotspotSubmitText}>Add Hotspot</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Hotspots list */}
              {hotspots.length > 0 ? (
                <View style={styles.hotspotsList}>
                  {hotspots.map((hotspot) => (
                    <View key={hotspot.id} style={styles.hotspotItem}>
                      <View style={styles.hotspotItemHeader}>
                        <View style={[
                          styles.hotspotTypeBadge,
                          hotspot.type === 'info' && styles.infoBadge,
                          hotspot.type === 'room' && styles.roomBadge,
                          hotspot.type === 'feature' && styles.featureBadge
                        ]}>
                          {hotspot.type === 'info' && <Info size={12} color="white" />}
                          {hotspot.type === 'room' && <Home size={12} color="white" />}
                          {hotspot.type === 'feature' && <MapPin size={12} color="white" />}
                          <Text style={styles.hotspotTypeBadgeText}>
                            {hotspot.type.charAt(0).toUpperCase() + hotspot.type.slice(1)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeHotspotButton}
                          onPress={() => removeHotspot(hotspot.id)}
                        >
                          <X size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.hotspotItemTitle}>{hotspot.title}</Text>
                      {hotspot.description && (
                        <Text style={styles.hotspotItemDescription} numberOfLines={2}>
                          {hotspot.description}
                        </Text>
                      )}
                      <Text style={styles.hotspotItemPosition}>
                        Position: ({hotspot.position.x.toFixed(1)}, {hotspot.position.y.toFixed(1)}, {hotspot.position.z.toFixed(1)})
                      </Text>
                      {hotspot.type === 'room' && hotspot.linkedRoomId && selectedProperty?.tourRooms && (
                        <Text style={styles.hotspotItemLink}>
                          Links to: {selectedProperty.tourRooms.find(r => r.id === hotspot.linkedRoomId)?.name || 'Unknown room'}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noHotspotsText}>
                  No hotspots added yet. Hotspots make your 3D model interactive and engaging.
                </Text>
              )}
            </View>
            
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
                    {(!isOnline || isOfflineMode) ? 'Save 3D Model Offline' : 'Upload 3D Model'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  optimizationSection: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text,
  },
  compressionContainer: {
    marginBottom: 12,
  },
  compressionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  compressionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  compressionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCompressionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compressionButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  activeCompressionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  optimizationNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
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
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  modelBadgeText: {
    fontSize: 10,
    color: colors.primary,
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
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
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
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  fileFormat: {
    fontSize: 12,
    color: colors.textLight,
  },
  changeFileButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  changeFileButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  pickFileButton: {
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
  pickFileButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  textureFilesContainer: {
    marginBottom: 16,
  },
  textureFilesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textureFilesList: {
    marginBottom: 12,
  },
  textureFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  texturePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  textureFileName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  removeTextureButton: {
    padding: 8,
  },
  addTextureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  addTextureButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  thumbnailContainer: {
    marginBottom: 12,
  },
  thumbnailPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  changeThumbnailButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  changeThumbnailButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  pickThumbnailButton: {
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
  pickThumbnailButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  // Hotspots styles
  hotspotsSection: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addHotspotButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addHotspotButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  hotspotDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  hotspotForm: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  hotspotTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hotspotTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    gap: 6,
  },
  activeHotspotTypeButton: {
    backgroundColor: colors.primary,
  },
  hotspotTypeText: {
    fontSize: 12,
    color: colors.text,
  },
  activeHotspotTypeText: {
    color: 'white',
    fontWeight: '500',
  },
  positionContainer: {
    marginBottom: 16,
  },
  positionInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  positionInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  positionLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginRight: 4,
  },
  positionTextInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
    color: colors.text,
  },
  roomLinkScroll: {
    marginBottom: 12,
  },
  roomLinkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeRoomLinkButton: {
    backgroundColor: colors.secondary,
  },
  roomLinkText: {
    fontSize: 12,
    color: colors.text,
  },
  activeRoomLinkText: {
    color: 'white',
    fontWeight: '500',
  },
  noRoomsText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  addHotspotSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addHotspotSubmitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  hotspotsList: {
    marginTop: 8,
  },
  hotspotItem: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  hotspotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotspotTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  infoBadge: {
    backgroundColor: '#00d1b2', // teal
  },
  roomBadge: {
    backgroundColor: '#3273dc', // blue
  },
  featureBadge: {
    backgroundColor: '#ff3860', // red
  },
  hotspotTypeBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  removeHotspotButton: {
    padding: 4,
  },
  hotspotItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  hotspotItemDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  hotspotItemPosition: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  hotspotItemLink: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  noHotspotsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
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