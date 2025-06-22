import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Eye, Home, ArrowLeft, Info } from 'lucide-react-native';
import { TourViewer } from '@/components/TourViewer';
import { ModelViewer } from '@/components/ModelViewer';
import { usePropertyStore } from '@/store/property-store';
import { colors } from '@/constants/colors';
import { Hotspot } from '@/types/property';

export default function TourScreen() {
  const { id } = useLocalSearchParams();
  const { properties, addToRecentlyViewed } = usePropertyStore();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'tour' | 'model' | 'overview'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  
  const property = properties.find(p => p.id === id);
  
  useEffect(() => {
    if (property) {
      // Add to recently viewed
      addToRecentlyViewed(property.id);
      setIsLoading(false);
    }
  }, [property]);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "3D Experience", headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading 3D experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "3D Experience", headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Property not found
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const has3DTour = property.has3DTour && property.tourRooms && property.tourRooms.length > 0;
  const has3DModel = property.has3DModel && property.models3D && property.models3D.length > 0;

  if (!has3DTour && !has3DModel) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "3D Experience", headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No 3D tour or model available for this property
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleHotspotClick = (hotspot: Hotspot) => {
    // If hotspot is a room link and we have a 3D tour, switch to tour mode
    if (hotspot.type === 'room' && has3DTour && hotspot.linkedRoomId) {
      setViewMode('tour');
      // You could also set the initial room ID here
    }
  };

  if (viewMode === 'overview') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.overviewHeader}>
          <TouchableOpacity 
            style={styles.backButtonSmall}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.overviewTitle}>3D Experience</Text>
        </View>
        
        <ScrollView style={styles.overviewContent}>
          <Image 
            source={{ uri: property.images[0] }}
            style={styles.propertyImage}
          />
          
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyAddress}>{property.address}</Text>
            <Text style={styles.propertyDetails}>
              {property.beds} bd • {property.baths} ba • {property.sqft.toLocaleString()} sqft
            </Text>
            <Text style={styles.propertyPrice}>${property.price.toLocaleString()}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Available 3D Experiences</Text>
          
          <View style={styles.experienceOptions}>
            {has3DTour && (
              <TouchableOpacity 
                style={styles.experienceCard}
                onPress={() => setViewMode('tour')}
              >
                <View style={styles.experienceImageContainer}>
                  <Image 
                    source={{ uri: property.tourRooms?.[0]?.panoramaImage || property.images[0] }}
                    style={styles.experienceImage}
                  />
                  <View style={styles.experienceBadge}>
                    <Home size={16} color="white" />
                    <Text style={styles.experienceBadgeText}>3D Tour</Text>
                  </View>
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceTitle}>Interactive 3D Tour</Text>
                  <Text style={styles.experienceDescription}>
                    Explore this property room by room with our immersive 3D tour
                  </Text>
                  <View style={styles.experienceStats}>
                    <Text style={styles.experienceStatsText}>
                      {property.tourRooms?.length || 0} rooms available
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.startExperienceButton}
                    onPress={() => setViewMode('tour')}
                  >
                    <Eye size={16} color="white" />
                    <Text style={styles.startExperienceButtonText}>Start Tour</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            
            {has3DModel && (
              <TouchableOpacity 
                style={styles.experienceCard}
                onPress={() => setViewMode('model')}
              >
                <View style={styles.experienceImageContainer}>
                  <Image 
                    source={{ uri: property.models3D?.[0]?.thumbnailUrl || property.images[0] }}
                    style={styles.experienceImage}
                  />
                  <View style={[styles.experienceBadge, styles.modelBadge]}>
                    <Box size={16} color="white" />
                    <Text style={styles.experienceBadgeText}>3D Model</Text>
                  </View>
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceTitle}>Interactive 3D Model</Text>
                  <Text style={styles.experienceDescription}>
                    Explore detailed 3D models of this property with interactive features
                  </Text>
                  <View style={styles.experienceStats}>
                    <Text style={styles.experienceStatsText}>
                      {property.models3D?.length || 0} models available
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.startExperienceButton, styles.modelButton]}
                    onPress={() => setViewMode('model')}
                  >
                    <Box size={16} color="white" />
                    <Text style={styles.startExperienceButtonText}>View Models</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Info size={20} color={colors.text} />
              <Text style={styles.infoTitle}>About 3D Experiences</Text>
            </View>
            <Text style={styles.infoText}>
              Our 3D experiences provide an immersive way to explore properties remotely. 
              The 3D tour lets you navigate between rooms as if you were there, while 3D models 
              allow you to examine specific features in detail.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: `3D Experience: ${property.address}`,
          headerShown: false
        }} 
      />
      
      {/* Toggle between tour and model if both are available */}
      {has3DTour && has3DModel && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={styles.overviewButton}
            onPress={() => setViewMode('overview')}
          >
            <Home size={18} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'tour' && styles.activeToggleButton]}
              onPress={() => setViewMode('tour')}
            >
              <Eye size={18} color={viewMode === 'tour' ? 'white' : colors.secondary} />
              <Text style={[styles.toggleText, viewMode === 'tour' && styles.activeToggleText]}>
                3D Tour
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'model' && styles.activeToggleButton]}
              onPress={() => setViewMode('model')}
            >
              <Box size={18} color={viewMode === 'model' ? 'white' : colors.primary} />
              <Text style={[styles.toggleText, viewMode === 'model' && styles.activeToggleText]}>
                3D Model
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {viewMode === 'tour' && has3DTour && property.tourRooms && (
        <TourViewer 
          rooms={property.tourRooms} 
          onClose={() => setViewMode('overview')}
        />
      )}
      
      {viewMode === 'model' && has3DModel && property.models3D && (
        <View style={styles.modelViewerContainer}>
          {/* Model selector if multiple models */}
          {property.models3D.length > 1 && (
            <View style={styles.modelSelectorContainer}>
              {property.models3D.map((model, index) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelSelectorButton,
                    selectedModelIndex === index && styles.activeModelSelectorButton
                  ]}
                  onPress={() => setSelectedModelIndex(index)}
                >
                  <Text 
                    style={[
                      styles.modelSelectorText,
                      selectedModelIndex === index && styles.activeModelSelectorText
                    ]}
                    numberOfLines={1}
                  >
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <ModelViewer 
            model={property.models3D[selectedModelIndex]} 
            onClose={() => setViewMode('overview')}
            onHotspotClick={handleHotspotClick}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    zIndex: 10,
    alignItems: 'center',
  },
  overviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleButtons: {
    flex: 1,
    flexDirection: 'row',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  activeToggleButton: {
    backgroundColor: colors.secondary,
  },
  toggleText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeToggleText: {
    color: 'white',
  },
  modelViewerContainer: {
    flex: 1,
  },
  modelSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    zIndex: 10,
  },
  modelSelectorButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeModelSelectorButton: {
    backgroundColor: colors.primary,
  },
  modelSelectorText: {
    color: colors.primary,
    fontSize: 12,
    textAlign: 'center',
  },
  activeModelSelectorText: {
    color: 'white',
    fontWeight: '600',
  },
  // Overview styles
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButtonSmall: {
    marginRight: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  overviewContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  propertyImage: {
    width: '100%',
    height: 250,
  },
  propertyInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    margin: 16,
  },
  experienceOptions: {
    paddingHorizontal: 16,
  },
  experienceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  experienceImageContainer: {
    position: 'relative',
  },
  experienceImage: {
    width: '100%',
    height: 180,
  },
  experienceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelBadge: {
    backgroundColor: colors.primary,
  },
  experienceBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  experienceInfo: {
    padding: 16,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  experienceStats: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  experienceStatsText: {
    fontSize: 12,
    color: colors.textLight,
  },
  startExperienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modelButton: {
    backgroundColor: colors.primary,
  },
  startExperienceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
});