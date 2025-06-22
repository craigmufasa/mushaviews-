import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  PanResponder,
  Animated,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { X, Maximize2, Minimize2, RotateCw, MapPin, Info, Home, ChevronRight, Eye, Wifi, WifiOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { TourRoom } from '@/types/property';

interface TourViewerProps {
  rooms: TourRoom[];
  initialRoomId?: string;
  onClose: () => void;
  enableVR?: boolean;
  offlineMode?: boolean;
}

const { width, height } = Dimensions.get('window');

// VR/360 viewing utilities
const detect360Support = (): boolean => {
  if (Platform.OS === 'web') {
    // Check for WebXR or DeviceOrientationEvent support
    return 'DeviceOrientationEvent' in window || 'xr' in navigator;
  }
  return true; // Native platforms typically support device orientation
};

export const TourViewer: React.FC<TourViewerProps> = ({ 
  rooms, 
  initialRoomId, 
  onClose,
  enableVR = false,
  offlineMode = false
}) => {
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId || rooms[0].id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [panoramaOffset, setPanoramaOffset] = useState(0);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<{roomId: string, name: string} | null>(null);
  const [isVRMode, setIsVRMode] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isOnline, setIsOnline] = useState(!offlineMode);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  const currentRoom = rooms.find(room => room.id === currentRoomId) || rooms[0];
  
  // Get connected rooms
  const connectedRooms = rooms.filter(room => 
    currentRoom.connections.includes(room.id)
  );

  // Animation values
  const pan = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const floorPlanAnimation = useRef(new Animated.Value(0)).current;
  const infoAnimation = useRef(new Animated.Value(0)).current;
  const vrTransition = useRef(new Animated.Value(0)).current;

  // VR/360 support detection
  const supports360 = detect360Support();

  // Set up pan responder for panorama movement with VR support
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isVRMode,
      onPanResponderGrant: () => {
        if (!isVRMode) {
          pan.setOffset(panoramaOffset);
          pan.setValue(0);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isVRMode) {
          // Enhanced sensitivity for better 360 experience
          const sensitivity = isFullscreen ? 0.8 : 0.5;
          pan.setValue(gestureState.dx * sensitivity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isVRMode) {
          pan.flattenOffset();
          const sensitivity = isFullscreen ? 0.8 : 0.5;
          setPanoramaOffset(panoramaOffset + gestureState.dx * sensitivity);
        }
      }
    })
  ).current;

  // Device orientation handling for VR mode
  useEffect(() => {
    if (Platform.OS === 'web' && supports360) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (isVRMode && event.alpha !== null && event.beta !== null && event.gamma !== null) {
          setDeviceOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma
          });
          
          // Convert device orientation to panorama offset
          const orientationOffset = (event.alpha || 0) * 2; // Adjust sensitivity
          setPanoramaOffset(orientationOffset);
          pan.setValue(orientationOffset);
        }
      };

      if (isVRMode) {
        window.addEventListener('deviceorientation', handleOrientation);
        
        // Request permission for iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          (DeviceOrientationEvent as any).requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
              }
            })
            .catch(console.error);
        }
      }

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [isVRMode, supports360]);

  // Network status monitoring
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Preload images for offline support
  useEffect(() => {
    const preloadImages = async () => {
      const imagesToPreload = rooms.map(room => room.panoramaImage);
      const preloaded = new Set<string>();
      
      for (const imageUrl of imagesToPreload) {
        try {
          if (Platform.OS === 'web') {
            const img = new window.Image();
            img.src = imageUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
          }
          preloaded.add(imageUrl);
        } catch (error) {
          console.warn('Failed to preload image:', imageUrl);
        }
      }
      
      setPreloadedImages(preloaded);
    };

    if (isOnline) {
      preloadImages();
    }
  }, [rooms, isOnline]);

  // Handle room change with optimizations
  useEffect(() => {
    setIsLoading(true);
    
    // Reset panorama position when changing rooms
    pan.setValue(0);
    setPanoramaOffset(0);
    
    // Fade transition for better UX
    Animated.sequence([
      Animated.timing(imageOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
    
    // Clear active hotspot when changing rooms
    setActiveHotspot(null);
  }, [currentRoomId]);

  // Adaptive image quality based on connection
  const getImageUrl = (baseUrl: string): string => {
    if (!isOnline && !preloadedImages.has(baseUrl)) {
      // Return a placeholder or cached version
      return baseUrl; // In a real app, this would be a cached/offline version
    }
    
    // Return different quality versions based on network and device
    const quality = imageQuality;
    
    // In a real implementation, you'd have different quality versions
    // For now, we'll use the base URL with quality parameters
    if (baseUrl.includes('?')) {
      return `${baseUrl}&quality=${quality}`;
    } else {
      return `${baseUrl}?quality=${quality}`;
    }
  };

  const navigateToRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleVRMode = () => {
    if (!supports360) {
      Alert.alert('VR Not Supported', 'Your device does not support VR/360 viewing');
      return;
    }
    
    setIsVRMode(!isVRMode);
    
    // Animate VR transition
    Animated.timing(vrTransition, {
      toValue: isVRMode ? 0 : 1,
      duration: 500,
      useNativeDriver: true
    }).start();
    
    if (!isVRMode && Platform.OS === 'web') {
      // Request fullscreen for better VR experience
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(console.error);
      }
    }
  };

  const toggleFloorPlan = () => {
    setShowFloorPlan(!showFloorPlan);
    Animated.timing(floorPlanAnimation, {
      toValue: showFloorPlan ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
    Animated.timing(infoAnimation, {
      toValue: showInfo ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  // Handle image load with quality adaptation
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    // Try lower quality if high quality fails
    if (imageQuality === 'high') {
      setImageQuality('medium');
    } else if (imageQuality === 'medium') {
      setImageQuality('low');
    }
  };

  // Position hotspots based on room connections with VR adjustments
  const getHotspotPosition = (index: number, total: number) => {
    // Distribute hotspots evenly around the panorama
    const angle = (index / total) * 360;
    const radius = isVRMode ? 35 : 40; // Closer in VR mode
    
    // Convert angle to radians and calculate position
    const radians = (angle * Math.PI) / 180;
    const x = 50 + radius * Math.cos(radians);
    const y = 50 + radius * Math.sin(radians);
    
    return {
      left: `${x}%`,
      top: `${y}%`,
    };
  };

  // Handle hotspot click with haptic feedback
  const handleHotspotClick = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setActiveHotspot({
        roomId: room.id,
        name: room.name
      });
      
      // Add haptic feedback for mobile
      if (Platform.OS !== 'web') {
        // In a real app, you'd use Haptics.selectionAsync() here
      }
    }
  };

  // Get room path (breadcrumb)
  const getRoomPath = () => {
    const path = [currentRoom];
    const mainRoom = rooms.find(room => room.isMain) || rooms[0];
    
    if (currentRoom.id === mainRoom.id) {
      return path;
    }
    
    if (mainRoom.connections.includes(currentRoom.id)) {
      return [mainRoom, currentRoom];
    }
    
    return [mainRoom, currentRoom];
  };

  return (
    <View style={[
      styles.container, 
      isFullscreen && styles.fullscreenContainer,
      isVRMode && styles.vrContainer
    ]}>
      <Animated.View 
        style={[
          styles.header,
          isVRMode && {
            opacity: vrTransition.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.3]
            })
          }
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.roomPathContainer}>
          {getRoomPath().map((room, index, array) => (
            <React.Fragment key={room.id}>
              {index > 0 && (
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.7)" />
              )}
              <TouchableOpacity 
                onPress={() => navigateToRoom(room.id)}
                disabled={room.id === currentRoomId}
              >
                <Text 
                  style={[
                    styles.roomPathText,
                    room.id === currentRoomId && styles.currentRoomPathText
                  ]}
                >
                  {room.name}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
        
        <View style={styles.headerButtons}>
          {/* Network status indicator */}
          <View style={styles.networkIndicator}>
            {isOnline ? (
              <Wifi size={16} color="rgba(255, 255, 255, 0.7)" />
            ) : (
              <WifiOff size={16} color="rgba(255, 255, 255, 0.7)" />
            )}
          </View>
          
          {enableVR && supports360 && (
            <TouchableOpacity onPress={toggleVRMode} style={styles.headerButton}>
              <Eye size={20} color={isVRMode ? colors.primary : "white"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleInfo} style={styles.headerButton}>
            <Info size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFloorPlan} style={styles.headerButton}>
            <Home size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFullscreen} style={styles.headerButton}>
            {isFullscreen ? (
              <Minimize2 size={24} color="white" />
            ) : (
              <Maximize2 size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.panoramaContainer} {...(!isVRMode ? panResponder.panHandlers : {})}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>
              {isVRMode ? 'Preparing VR experience...' : 'Loading panorama...'}
            </Text>
            {!isOnline && (
              <Text style={styles.offlineText}>Offline mode - using cached content</Text>
            )}
          </View>
        )}
        
        <Animated.View 
          style={[
            styles.panoramaWrapper,
            {
              transform: [
                { 
                  translateX: isVRMode ? 
                    vrTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0]
                    }) : pan 
                },
                {
                  scale: isVRMode ? 
                    vrTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2]
                    }) : 1
                }
              ],
              opacity: imageOpacity
            }
          ]}
        >
          <Image
            source={{ uri: getImageUrl(currentRoom.panoramaImage) }}
            style={[
              styles.panoramaImage,
              isVRMode && styles.vrPanoramaImage
            ]}
            contentFit="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* VR overlay effects */}
          {isVRMode && (
            <Animated.View 
              style={[
                styles.vrOverlay,
                {
                  opacity: vrTransition
                }
              ]}
            />
          )}
        </Animated.View>
        
        {/* Room navigation hotspots */}
        {connectedRooms.map((room, index) => (
          <Animated.View
            key={room.id}
            style={[
              styles.hotspot, 
              getHotspotPosition(index, connectedRooms.length),
              isVRMode && {
                transform: [{
                  scale: vrTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5]
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => handleHotspotClick(room.id)}
              style={styles.hotspotTouchable}
            >
              <View style={[styles.hotspotInner, isVRMode && styles.vrHotspotInner]}>
                <Text style={[styles.hotspotText, isVRMode && styles.vrHotspotText]}>
                  {room.name}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
        
        {/* Active hotspot info */}
        {activeHotspot && !isVRMode && (
          <View style={styles.hotspotInfoContainer}>
            <Text style={styles.hotspotInfoTitle}>{activeHotspot.name}</Text>
            <TouchableOpacity 
              style={styles.goToRoomButton}
              onPress={() => navigateToRoom(activeHotspot.roomId)}
            >
              <Text style={styles.goToRoomButtonText}>Go to this room</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Floor plan overlay */}
        {showFloorPlan && !isVRMode && (
          <Animated.View 
            style={[
              styles.floorPlanContainer,
              {
                opacity: floorPlanAnimation,
                transform: [{ 
                  translateY: floorPlanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.floorPlanHeader}>
              <Text style={styles.floorPlanTitle}>Floor Plan</Text>
              <TouchableOpacity onPress={toggleFloorPlan}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.floorPlanContent}>
              <View style={styles.floorPlanPlaceholder}>
                <View style={styles.floorPlanGrid}>
                  {rooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.floorPlanRoom,
                        currentRoomId === room.id && styles.floorPlanRoomActive
                      ]}
                      onPress={() => navigateToRoom(room.id)}
                    >
                      <Text 
                        style={[
                          styles.floorPlanRoomText,
                          currentRoomId === room.id && styles.floorPlanRoomTextActive
                        ]}
                      >
                        {room.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.floorPlanNote}>
                  Interactive floor plan • Tap rooms to navigate
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Room info panel */}
        {showInfo && !isVRMode && (
          <Animated.View 
            style={[
              styles.infoPanel,
              {
                opacity: infoAnimation,
                transform: [{ 
                  translateY: infoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.infoPanelHeader}>
              <Text style={styles.infoPanelTitle}>Room Information</Text>
              <TouchableOpacity onPress={toggleInfo}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoPanelContent}>
              <Text style={styles.infoPanelRoomName}>{currentRoom.name}</Text>
              
              {currentRoom.description && (
                <Text style={styles.infoPanelDescription}>
                  {currentRoom.description}
                </Text>
              )}
              
              <View style={styles.infoPanelConnections}>
                <Text style={styles.infoPanelConnectionsTitle}>
                  Connected Rooms:
                </Text>
                {connectedRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={styles.infoPanelConnectionItem}
                    onPress={() => navigateToRoom(room.id)}
                  >
                    <MapPin size={16} color={colors.secondary} />
                    <Text style={styles.infoPanelConnectionText}>
                      {room.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Quality and performance info */}
              <View style={styles.performanceInfo}>
                <Text style={styles.performanceTitle}>Performance:</Text>
                <Text style={styles.performanceText}>
                  Quality: {imageQuality.toUpperCase()} • 
                  {isOnline ? ' Online' : ' Offline'} • 
                  {preloadedImages.size}/{rooms.length} cached
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Room selector - hidden in VR mode */}
      {!isVRMode && (
        <Animated.View 
          style={[
            styles.roomSelector,
            {
              opacity: vrTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0]
              })
            }
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomButton,
                  currentRoomId === room.id && styles.activeRoomButton
                ]}
                onPress={() => navigateToRoom(room.id)}
              >
                <Text 
                  style={[
                    styles.roomButtonText,
                    currentRoomId === room.id && styles.activeRoomButtonText
                  ]}
                >
                  {room.name}
                </Text>
                {!preloadedImages.has(room.panoramaImage) && !isOnline && (
                  <View style={styles.offlineIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Instructions - adaptive based on mode */}
      {!isVRMode && (
        <Animated.View 
          style={[
            styles.instructions,
            {
              opacity: vrTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0]
              })
            }
          ]}
        >
          <Text style={styles.instructionsText}>
            Drag to look around • Tap on hotspots to move between rooms
            {supports360 && enableVR && ' • Tap VR for immersive experience'}
          </Text>
        </Animated.View>
      )}
      
      {/* VR mode instructions */}
      {isVRMode && (
        <Animated.View 
          style={[
            styles.vrInstructions,
            {
              opacity: vrTransition
            }
          ]}
        >
          <Text style={styles.vrInstructionsText}>
            Move your device to look around • Tap hotspots to navigate
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  vrContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    padding: 8,
  },
  roomPathContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roomPathText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  currentRoomPathText: {
    color: 'white',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIndicator: {
    padding: 8,
    marginRight: 4,
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  panoramaContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  panoramaWrapper: {
    width: width * 2, // Make panorama wider for scrolling effect
    height: '100%',
  },
  panoramaImage: {
    width: '100%',
    height: '100%',
  },
  vrPanoramaImage: {
    width: '120%', // Slightly wider for VR effect
    height: '120%',
    marginLeft: '-10%',
    marginTop: '-10%',
  },
  vrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    margin: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  offlineText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontSize: 14,
  },
  hotspot: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  hotspotTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 209, 178, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  vrHotspotInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 209, 178, 0.9)',
    borderWidth: 3,
    shadowColor: '#00d1b2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  hotspotText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: -20,
    width: 80,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  vrHotspotText: {
    fontSize: 12,
    bottom: -25,
    width: 100,
    textShadowRadius: 4,
  },
  hotspotInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hotspotInfoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  goToRoomButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  goToRoomButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  floorPlanContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floorPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  floorPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  floorPlanContent: {
    padding: 12,
  },
  floorPlanPlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  floorPlanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  floorPlanRoom: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  floorPlanRoomActive: {
    backgroundColor: colors.secondary,
  },
  floorPlanRoomText: {
    fontSize: 12,
    color: colors.text,
  },
  floorPlanRoomTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  floorPlanNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  infoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoPanelContent: {
    padding: 12,
  },
  infoPanelRoomName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoPanelDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoPanelConnections: {
    marginTop: 8,
    marginBottom: 16,
  },
  infoPanelConnectionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoPanelConnectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoPanelConnectionText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
  },
  performanceInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 12,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  performanceText: {
    fontSize: 12,
    color: colors.textLight,
  },
  roomSelector: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  roomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  activeRoomButton: {
    backgroundColor: colors.secondary,
  },
  roomButtonText: {
    color: 'white',
    fontSize: 14,
  },
  activeRoomButtonText: {
    fontWeight: '600',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'orange',
  },
  instructions: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  vrInstructions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  vrInstructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});