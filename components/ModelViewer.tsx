import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  Image,
  Animated,
  Alert
} from 'react-native';
import { X, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, Move, Info, MapPin, Eye, Smartphone } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Model3D, Hotspot } from '@/types/property';

// Import Three.js only on web platform
let THREE: any;
let GLTFLoader: any;
let TextureLoader: any;
if (Platform.OS === 'web') {
  THREE = require('three');
  GLTFLoader = require('three/examples/jsm/loaders/GLTFLoader').GLTFLoader;
  TextureLoader = THREE?.TextureLoader;
}

interface ModelViewerProps {
  model: Model3D;
  onClose: () => void;
  onHotspotClick?: (hotspot: Hotspot) => void;
  enableAR?: boolean;
  deviceCapabilities?: 'low' | 'medium' | 'high';
}

const { width, height } = Dimensions.get('window');

// Device capability detection
const detectDeviceCapabilities = (): 'low' | 'medium' | 'high' => {
  if (Platform.OS === 'web') {
    // Basic web device detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'low';
    
    const webglContext = gl as WebGLRenderingContext;
    const renderer = webglContext.getParameter(webglContext.RENDERER);
    const vendor = webglContext.getParameter(webglContext.VENDOR);
    
    // Simple heuristic based on renderer info
    if (renderer && (renderer.includes('Intel') || renderer.includes('Mali'))) return 'low';
    if (renderer && (renderer.includes('Adreno') || renderer.includes('PowerVR'))) return 'medium';
    return 'high';
  }
  
  // For native platforms, use a simple heuristic
  const screenPixels = width * height;
  if (screenPixels < 1000000) return 'low'; // Less than ~1MP
  if (screenPixels < 2000000) return 'medium'; // Less than ~2MP
  return 'high';
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ 
  model, 
  onClose, 
  onHotspotClick,
  enableAR = false,
  deviceCapabilities
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'rotate' | 'zoom' | 'pan'>('rotate');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [renderQuality, setRenderQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isARMode, setIsARMode] = useState(false);
  const [adaptiveRendering, setAdaptiveRendering] = useState(true);
  
  // Detect device capabilities
  const detectedCapabilities = deviceCapabilities || detectDeviceCapabilities();
  
  // Animation for info panel
  const infoAnimation = useRef(new Animated.Value(0)).current;
  
  // For web only
  const containerRef = useRef<View>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const hotspotMarkersRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const performanceMonitorRef = useRef({ frameCount: 0, lastTime: 0, fps: 60 });
  
  // Adaptive rendering settings based on device capabilities
  const getRenderingSettings = () => {
    const capability = detectedCapabilities;
    
    switch (capability) {
      case 'low':
        return {
          pixelRatio: 0.5,
          antialias: false,
          shadows: false,
          maxLights: 2,
          textureSize: 512,
          modelComplexity: 'low',
          targetFPS: 30
        };
      case 'medium':
        return {
          pixelRatio: 0.75,
          antialias: true,
          shadows: false,
          maxLights: 3,
          textureSize: 1024,
          modelComplexity: 'medium',
          targetFPS: 45
        };
      case 'high':
        return {
          pixelRatio: 1.0,
          antialias: true,
          shadows: true,
          maxLights: 5,
          textureSize: 2048,
          modelComplexity: 'high',
          targetFPS: 60
        };
      default:
        return {
          pixelRatio: 0.75,
          antialias: true,
          shadows: false,
          maxLights: 3,
          textureSize: 1024,
          modelComplexity: 'medium',
          targetFPS: 45
        };
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
    Animated.timing(infoAnimation, {
      toValue: showInfo ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const toggleARMode = () => {
    if (Platform.OS === 'web' && 'xr' in navigator) {
      setIsARMode(!isARMode);
      // In a real implementation, this would initialize WebXR
      Alert.alert('AR Mode', isARMode ? 'AR mode disabled' : 'AR mode enabled (WebXR required)');
    } else {
      Alert.alert('AR Not Available', 'AR features require a compatible device and browser');
    }
  };

  // Performance monitoring
  const monitorPerformance = () => {
    const now = performance.now();
    const monitor = performanceMonitorRef.current;
    
    monitor.frameCount++;
    
    if (now - monitor.lastTime >= 1000) {
      monitor.fps = monitor.frameCount;
      monitor.frameCount = 0;
      monitor.lastTime = now;
      
      // Adaptive quality adjustment
      if (adaptiveRendering) {
        const settings = getRenderingSettings();
        if (monitor.fps < settings.targetFPS * 0.8) {
          // Reduce quality if FPS is too low
          if (renderQuality === 'high') {
            setRenderQuality('medium');
          } else if (renderQuality === 'medium') {
            setRenderQuality('low');
          }
        } else if (monitor.fps > settings.targetFPS * 1.1 && renderQuality !== 'high') {
          // Increase quality if FPS is stable
          if (renderQuality === 'low') {
            setRenderQuality('medium');
          } else if (renderQuality === 'medium') {
            setRenderQuality('high');
          }
        }
      }
    }
  };

  // Setup Three.js scene for web with optimization
  useEffect(() => {
    if (Platform.OS === 'web') {
      setupThreeJsScene();
    } else {
      // For native platforms, show model info and thumbnail
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
    
    return () => {
      if (Platform.OS === 'web') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      }
    };
  }, []);

  // Update renderer settings when quality changes
  useEffect(() => {
    if (Platform.OS === 'web' && rendererRef.current) {
      const settings = getRenderingSettings();
      const qualitySettings = {
        low: { pixelRatio: 0.5, antialias: false },
        medium: { pixelRatio: 0.75, antialias: true },
        high: { pixelRatio: 1.0, antialias: true }
      };
      
      const quality = qualitySettings[renderQuality];
      rendererRef.current.setPixelRatio(quality.pixelRatio);
      
      // Update camera and hotspot positions
      updateHotspotPositions();
    }
  }, [renderQuality]);

  // Update renderer size when fullscreen changes
  useEffect(() => {
    if (Platform.OS === 'web' && rendererRef.current && cameraRef.current) {
      const newWidth = isFullscreen ? window.innerWidth : width;
      const newHeight = isFullscreen ? window.innerHeight : height * 0.6;
      
      rendererRef.current.setSize(newWidth, newHeight);
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      // Update hotspot positions
      updateHotspotPositions();
    }
  }, [isFullscreen]);

  const setupThreeJsScene = async () => {
    if (!containerRef.current || !THREE) return;
    
    try {
      const settings = getRenderingSettings();
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;
      
      // Create camera with optimized settings
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 5;
      cameraRef.current = camera;
      
      // Create renderer with adaptive settings
      const renderer = new THREE.WebGLRenderer({ 
        antialias: settings.antialias,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: detectedCapabilities === 'low' ? 'low-power' : 'high-performance'
      });
      
      renderer.setSize(width, height * 0.6);
      renderer.setPixelRatio(settings.pixelRatio);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.physicallyCorrectLights = true;
      
      // Enable shadows only for high-end devices
      if (settings.shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      
      rendererRef.current = renderer;
      
      // Add renderer to DOM
      const container = containerRef.current as any;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
      
      // Add optimized lighting
      setupOptimizedLighting(scene, settings);
      
      // Load model with optimization
      await loadModelWithOptimization();
      
      // Add event listeners for interaction
      setupEventListeners(renderer.domElement);
      
      // Start optimized animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        
        // Monitor performance
        monitorPerformance();
        
        if (modelRef.current && currentMode === 'rotate' && !isDraggingRef.current) {
          modelRef.current.rotation.y += 0.005;
        }
        
        // Update hotspot positions if model is rotating
        if (modelRef.current && currentMode === 'rotate' && !isDraggingRef.current) {
          updateHotspotPositions();
        }
        
        renderer.render(scene, camera);
      };
      animate();
      
    } catch (err) {
      console.error('Error setting up Three.js scene:', err);
      setError('Failed to initialize 3D viewer');
      setIsLoading(false);
    }
  };

  const setupOptimizedLighting = (scene: any, settings: any) => {
    // Clear existing lights
    const lights = scene.children.filter((child: any) => child.isLight);
    lights.forEach((light: any) => scene.remove(light));
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    
    if (settings.shadows) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
    }
    
    scene.add(directionalLight);
    
    // Add additional lights based on device capability
    if (settings.maxLights > 2) {
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.3);
      scene.add(hemisphereLight);
    }
    
    if (settings.maxLights > 3) {
      const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
      pointLight.position.set(-2, 2, 2);
      scene.add(pointLight);
    }
  };
  
  const setupEventListeners = (domElement: HTMLCanvasElement) => {
    // Mouse down event
    domElement.addEventListener('mousedown', (event) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    });
    
    // Mouse move event
    domElement.addEventListener('mousemove', (event) => {
      if (!isDraggingRef.current) return;
      
      const deltaMove = {
        x: event.clientX - previousMousePositionRef.current.x,
        y: event.clientY - previousMousePositionRef.current.y
      };
      
      if (modelRef.current) {
        if (currentMode === 'rotate') {
          // Rotate model
          modelRef.current.rotation.y += deltaMove.x * 0.01;
          modelRef.current.rotation.x += deltaMove.y * 0.01;
          
          // Update hotspot positions
          updateHotspotPositions();
        } else if (currentMode === 'pan') {
          // Pan model
          modelRef.current.position.x += deltaMove.x * 0.01;
          modelRef.current.position.y -= deltaMove.y * 0.01;
          
          // Update hotspot positions
          updateHotspotPositions();
        }
      }
      
      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    });
    
    // Mouse up event
    domElement.addEventListener('mouseup', () => {
      isDraggingRef.current = false;
    });
    
    // Mouse leave event
    domElement.addEventListener('mouseleave', () => {
      isDraggingRef.current = false;
    });
    
    // Wheel event for zooming
    domElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      
      if (currentMode === 'zoom' && cameraRef.current) {
        // Zoom camera
        const zoomSpeed = 0.1;
        cameraRef.current.position.z += event.deltaY * 0.01 * zoomSpeed;
        
        // Limit zoom
        cameraRef.current.position.z = Math.max(1, Math.min(10, cameraRef.current.position.z));
        
        // Update hotspot positions
        updateHotspotPositions();
      }
    });
    
    // Click event for hotspots
    domElement.addEventListener('click', (event) => {
      if (isDraggingRef.current) return; // Don't handle clicks during drag
      
      // Check if click is on a hotspot
      if (model.hotspots && model.hotspots.length > 0 && hotspotMarkersRef.current.length > 0) {
        // Convert mouse position to normalized device coordinates (-1 to +1)
        const rect = domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / domElement.clientWidth) * 2 - 1;
        const y = -((event.clientY - rect.top) / domElement.clientHeight) * 2 + 1;
        
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, cameraRef.current);
        
        // Check for intersections with hotspot markers
        const intersects = raycaster.intersectObjects(hotspotMarkersRef.current);
        
        if (intersects.length > 0) {
          const hotspotIndex = hotspotMarkersRef.current.indexOf(intersects[0].object);
          if (hotspotIndex !== -1 && model.hotspots) {
            const hotspot = model.hotspots[hotspotIndex];
            setActiveHotspot(hotspot);
            if (onHotspotClick) {
              onHotspotClick(hotspot);
            }
          }
        } else {
          setActiveHotspot(null);
        }
      }
    });
  };
  
  const loadModelWithOptimization = async () => {
    if (!sceneRef.current || !GLTFLoader) {
      setError('3D viewer not supported on this platform');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const settings = getRenderingSettings();
      
      const loader = new GLTFLoader();
      
      // Set up texture loading manager to track progress
      const manager = new THREE.LoadingManager();
      manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        setLoadingProgress(progress);
      };
      
      // Load the model with optimization
      loader.setPath(getBasePath(model.modelUrl));
      loader.load(
        model.modelUrl,
        (gltf: any) => {
          const object = gltf.scene;
          
          // Apply optimizations based on device capabilities
          if (object && object.traverse) {
            object.traverse((child: any) => {
              if (child.isMesh) {
                // Enable shadows only for high-end devices
                if (settings.shadows) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
                
                // Optimize materials based on device capability
                if (child.material) {
                  optimizeMaterial(child.material, settings);
                }
                
                // Optimize geometry for low-end devices
                if (settings.modelComplexity === 'low' && child.geometry) {
                  optimizeGeometry(child.geometry);
                }
              }
            });
          }
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          object.position.x = -center.x;
          object.position.y = -center.y;
          object.position.z = -center.z;
          
          // Apply scaling
          if (model.scale) {
            object.scale.set(model.scale, model.scale, model.scale);
          } else {
            // Auto-scale to fit view
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            object.scale.set(scale, scale, scale);
          }
          
          // Apply custom position and rotation
          if (model.position) {
            object.position.set(model.position.x, model.position.y, model.position.z);
          }
          
          if (model.rotation) {
            object.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z);
          }
          
          // Add to scene
          sceneRef.current.add(object);
          modelRef.current = object;
          
          // Add hotspots if available
          if (model.hotspots && model.hotspots.length > 0) {
            addHotspots(model.hotspots);
          }
          
          // Handle animations if present
          if (gltf.animations && gltf.animations.length > 0) {
            setupAnimations(gltf, object);
          }
          
          setIsLoading(false);
        },
        (progress: any) => {
          const percent = Math.round(progress.loaded / progress.total * 100);
          setLoadingProgress(percent);
        },
        (error: any) => {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model');
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Error in loadModelWithOptimization:', err);
      setError('Failed to load 3D model');
      setIsLoading(false);
    }
  };

  const optimizeMaterial = (material: any, settings: any) => {
    material.needsUpdate = true;
    
    // Optimize textures based on device capability
    if (material.map) {
      optimizeTexture(material.map, settings.textureSize);
    }
    if (material.normalMap) {
      optimizeTexture(material.normalMap, settings.textureSize);
    }
    if (material.roughnessMap) {
      optimizeTexture(material.roughnessMap, settings.textureSize);
    }
    
    // Adjust material properties for performance
    if (settings.modelComplexity === 'low') {
      material.metalness = 0.5;
      material.roughness = 0.5;
    } else {
      material.metalness = 0.8;
      material.roughness = 0.2;
    }
  };

  const optimizeTexture = (texture: any, maxSize: number) => {
    // This would typically involve resizing textures
    // For now, we just ensure proper settings
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
  };

  const optimizeGeometry = (geometry: any) => {
    // Simplify geometry for low-end devices
    if (geometry.attributes && geometry.attributes.position) {
      const vertexCount = geometry.attributes.position.count;
      
      // If too many vertices, we could implement mesh decimation here
      if (vertexCount > 10000) {
        console.log('High vertex count detected:', vertexCount, 'Consider using a lower poly model');
      }
    }
    
    // Compute bounding sphere for frustum culling
    geometry.computeBoundingSphere();
  };

  const setupAnimations = (gltf: any, object: any) => {
    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
    
    // Update animation in render loop
    const clock = new THREE.Clock();
    const originalAnimate = animationFrameRef.current;
    
    const animateWithMixer = () => {
      animationFrameRef.current = requestAnimationFrame(animateWithMixer);
      
      const delta = clock.getDelta();
      mixer.update(delta);
      
      // Monitor performance
      monitorPerformance();
      
      if (modelRef.current && currentMode === 'rotate' && !isDraggingRef.current) {
        modelRef.current.rotation.y += 0.005;
        updateHotspotPositions();
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    // Cancel previous animation frame
    if (originalAnimate) {
      cancelAnimationFrame(originalAnimate);
    }
    
    // Start new animation loop
    animateWithMixer();
  };

  // Add hotspots to the scene
  const addHotspots = (hotspots: Hotspot[]) => {
    if (!THREE || !sceneRef.current || !modelRef.current) return;
    
    // Clear existing hotspot markers
    hotspotMarkersRef.current.forEach(marker => {
      sceneRef.current.remove(marker);
    });
    hotspotMarkersRef.current = [];
    
    // Create new hotspot markers
    hotspots.forEach(hotspot => {
      // Create a sphere geometry for the hotspot
      const geometry = new THREE.SphereGeometry(0.05, 8, 8); // Reduced complexity for performance
      
      // Create material with custom color based on hotspot type
      let color;
      switch (hotspot.type) {
        case 'info':
          color = 0x00d1b2; // teal
          break;
        case 'room':
          color = 0x3273dc; // blue
          break;
        case 'feature':
          color = 0xff3860; // red
          break;
        default:
          color = 0xffdd57; // yellow
      }
      
      const material = new THREE.MeshBasicMaterial({ color });
      
      // Create mesh and position it
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(
        hotspot.position.x,
        hotspot.position.y,
        hotspot.position.z
      );
      
      // Add pulse animation effect (simplified for performance)
      const pulseGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const pulseMaterial = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true,
        opacity: 0.3
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      marker.add(pulse);
      
      // Add to scene and store reference
      sceneRef.current.add(marker);
      hotspotMarkersRef.current.push(marker);
    });
    
    // Initial update of hotspot positions
    updateHotspotPositions();
  };
  
  // Update hotspot positions based on camera view
  const updateHotspotPositions = () => {
    if (!THREE || !sceneRef.current || !cameraRef.current || !modelRef.current) return;
    
    // No need to update if no hotspots
    if (!model.hotspots || model.hotspots.length === 0 || hotspotMarkersRef.current.length === 0) return;
    
    // Update each hotspot marker
    hotspotMarkersRef.current.forEach((marker, index) => {
      if (index < model.hotspots!.length) {
        const hotspot = model.hotspots![index];
        
        // Apply model's transformation to hotspot position
        const position = new THREE.Vector3(
          hotspot.position.x,
          hotspot.position.y,
          hotspot.position.z
        );
        
        // Apply model's rotation to hotspot position
        position.applyMatrix4(modelRef.current.matrixWorld);
        
        // Update marker position
        marker.position.copy(position);
        
        // Scale based on distance to camera
        const distance = cameraRef.current.position.distanceTo(marker.position);
        const scale = Math.max(0.5, Math.min(1.5, 5 / distance));
        marker.scale.set(scale, scale, scale);
        
        // Pulse animation (simplified)
        if (marker.children.length > 0) {
          const pulse = marker.children[0];
          const time = Date.now() * 0.001;
          const scale = 1 + 0.2 * Math.sin(time * 3);
          pulse.scale.set(scale, scale, scale);
        }
      }
    });
  };

  // Helper to get the base path for relative texture references
  const getBasePath = (url: string): string => {
    const lastSlashIndex = url.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      return url.substring(0, lastSlashIndex + 1);
    }
    return '';
  };

  const handleModeChange = (mode: 'rotate' | 'zoom' | 'pan') => {
    setCurrentMode(mode);
  };

  const handleZoomIn = () => {
    if (Platform.OS === 'web' && cameraRef.current) {
      cameraRef.current.position.z -= 0.5;
      cameraRef.current.position.z = Math.max(1, cameraRef.current.position.z);
      updateHotspotPositions();
    }
  };

  const handleZoomOut = () => {
    if (Platform.OS === 'web' && cameraRef.current) {
      cameraRef.current.position.z += 0.5;
      cameraRef.current.position.z = Math.min(10, cameraRef.current.position.z);
      updateHotspotPositions();
    }
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.modelName}>{model.name}</Text>
        <View style={styles.headerButtons}>
          {enableAR && (
            <TouchableOpacity onPress={toggleARMode} style={styles.arButton}>
              <Eye size={20} color={isARMode ? colors.primary : "white"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleInfo} style={styles.infoButton}>
            <Info size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenButton}>
            {isFullscreen ? (
              <Minimize2 size={24} color="white" />
            ) : (
              <Maximize2 size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modelContainer}>
        {Platform.OS === 'web' ? (
          <View ref={containerRef} style={styles.webGLContainer} />
        ) : (
          <View style={styles.nativeContainer}>
            <Image 
              source={{ uri: model.thumbnailUrl }}
              style={styles.modelThumbnail}
              resizeMode="contain"
            />
            <Text style={styles.nativeNotSupportedText}>
              3D model viewing is available on web
            </Text>
            <Text style={styles.nativeInfoText}>
              Device: {detectedCapabilities} capability
            </Text>
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading 3D Model... {loadingProgress}%</Text>
            <Text style={styles.loadingSubtext}>
              Optimizing for {detectedCapabilities} performance device
            </Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              3D model viewing may not be fully supported on this device or browser.
            </Text>
          </View>
        )}
        
        {/* Performance indicator */}
        {Platform.OS === 'web' && !isLoading && !error && (
          <View style={styles.performanceIndicator}>
            <Smartphone size={12} color={colors.textLight} />
            <Text style={styles.performanceText}>
              {detectedCapabilities.toUpperCase()} • {renderQuality.toUpperCase()} • {performanceMonitorRef.current.fps}fps
            </Text>
          </View>
        )}
        
        {/* Active hotspot info */}
        {activeHotspot && (
          <View style={styles.hotspotInfoContainer}>
            <View style={[styles.hotspotInfoBadge, 
              activeHotspot.type === 'info' && styles.infoBadge,
              activeHotspot.type === 'room' && styles.roomBadge,
              activeHotspot.type === 'feature' && styles.featureBadge
            ]}>
              <MapPin size={14} color="white" />
              <Text style={styles.hotspotInfoBadgeText}>
                {activeHotspot.type.charAt(0).toUpperCase() + activeHotspot.type.slice(1)}
              </Text>
            </View>
            <Text style={styles.hotspotInfoTitle}>{activeHotspot.title}</Text>
            <Text style={styles.hotspotInfoDescription}>{activeHotspot.description}</Text>
          </View>
        )}
      </View>

      {/* Controls - only show on web */}
      {Platform.OS === 'web' && (
        <>
          <View style={styles.controlsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.controlButton, currentMode === 'rotate' && styles.activeControlButton]} 
                onPress={() => handleModeChange('rotate')}
              >
                <RotateCw size={20} color={currentMode === 'rotate' ? colors.primary : 'white'} />
                <Text style={[styles.controlText, currentMode === 'rotate' && styles.activeControlText]}>Rotate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, currentMode === 'zoom' && styles.activeControlButton]} 
                onPress={() => handleModeChange('zoom')}
              >
                <ZoomIn size={20} color={currentMode === 'zoom' ? colors.primary : 'white'} />
                <Text style={[styles.controlText, currentMode === 'zoom' && styles.activeControlText]}>Zoom</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, currentMode === 'pan' && styles.activeControlButton]} 
                onPress={() => handleModeChange('pan')}
              >
                <Move size={20} color={currentMode === 'pan' ? colors.primary : 'white'} />
                <Text style={[styles.controlText, currentMode === 'pan' && styles.activeControlText]}>Pan</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Quality controls */}
            <View style={styles.qualityControls}>
              <TouchableOpacity 
                style={styles.qualityButton}
                onPress={() => setAdaptiveRendering(!adaptiveRendering)}
              >
                <Text style={[styles.qualityButtonText, adaptiveRendering && styles.activeQualityText]}>
                  AUTO
                </Text>
              </TouchableOpacity>
            </View>

            {/* Zoom buttons */}
            {currentMode === 'zoom' && (
              <View style={styles.zoomButtons}>
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                  <ZoomIn size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                  <ZoomOut size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {currentMode === 'rotate' ? 'Drag to rotate the model • Click on hotspots for details' : 
               currentMode === 'zoom' ? 'Use mouse wheel or buttons to zoom' : 
               'Drag to pan the view'}
            </Text>
          </View>
        </>
      )}
      
      {/* Model info panel */}
      {showInfo && !isLoading && !error && (
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
            <Text style={styles.infoPanelTitle}>Model Information</Text>
            <TouchableOpacity onPress={toggleInfo}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.infoPanelContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Format:</Text>
              <Text style={styles.infoValue}>
                {model.format.replace('3d-model/', '').toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device:</Text>
              <Text style={styles.infoValue}>
                {detectedCapabilities.charAt(0).toUpperCase() + detectedCapabilities.slice(1)} Performance
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quality:</Text>
              <Text style={styles.infoValue}>
                {renderQuality.charAt(0).toUpperCase() + renderQuality.slice(1)} 
                {adaptiveRendering && ' (Auto)'}
              </Text>
            </View>
            
            {model.textureInfo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Textures:</Text>
                <Text style={styles.infoValue}>{model.textureInfo}</Text>
              </View>
            )}
            
            {model.scale && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scale:</Text>
                <Text style={styles.infoValue}>{model.scale}</Text>
              </View>
            )}
            
            {model.description && (
              <View style={styles.infoDescription}>
                <Text style={styles.infoDescriptionText}>{model.description}</Text>
              </View>
            )}
            
            {model.hotspots && model.hotspots.length > 0 && (
              <View style={styles.hotspotsList}>
                <Text style={styles.hotspotsTitle}>Points of Interest</Text>
                {model.hotspots.map((hotspot, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.hotspotItem}
                    onPress={() => setActiveHotspot(hotspot)}
                  >
                    <View style={[
                      styles.hotspotItemBadge,
                      hotspot.type === 'info' && styles.infoBadge,
                      hotspot.type === 'room' && styles.roomBadge,
                      hotspot.type === 'feature' && styles.featureBadge
                    ]}>
                      <MapPin size={12} color="white" />
                    </View>
                    <Text style={styles.hotspotItemTitle}>{hotspot.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
      
      {/* Model info footer */}
      {!isLoading && !error && (
        <View style={styles.modelInfoContainer}>
          <Text style={styles.modelInfoText}>
            Format: {model.format.replace('3d-model/', '').toUpperCase()}
            {model.textureInfo && ` • ${model.textureInfo}`}
            {Platform.OS === 'web' && ` • Optimized for ${detectedCapabilities} devices`}
          </Text>
        </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arButton: {
    padding: 8,
    marginRight: 8,
  },
  infoButton: {
    padding: 8,
    marginRight: 8,
  },
  fullscreenButton: {
    padding: 8,
  },
  modelName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modelContainer: {
    flex: 1,
    position: 'relative',
  },
  webGLContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modelThumbnail: {
    width: '100%',
    height: '80%',
    borderRadius: 8,
  },
  nativeNotSupportedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  nativeInfoText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  performanceIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  performanceText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
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
  hotspotInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
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
  hotspotInfoBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  hotspotInfoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  hotspotInfoDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  controlsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  activeControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  controlText: {
    color: 'white',
    fontSize: 14,
  },
  activeControlText: {
    color: colors.primary,
    fontWeight: '600',
  },
  qualityControls: {
    flexDirection: 'row',
    gap: 4,
  },
  qualityButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  qualityButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  activeQualityText: {
    color: colors.primary,
  },
  zoomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  infoPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 300,
    maxHeight: 400,
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
    maxHeight: 340,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  infoDescription: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoDescriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  hotspotsList: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  hotspotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  hotspotItemBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hotspotItemTitle: {
    fontSize: 14,
    color: colors.text,
  },
  modelInfoContainer: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modelInfoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
});