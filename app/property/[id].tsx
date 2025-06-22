import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Platform,
  Modal,
  Share
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Share2, MapPin, Bed, Bath, Square, Box } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { usePropertyStore } from '@/store/property-store';
import { PropertyImageGallery } from '@/components/PropertyImageGallery';
import { PropertyFeatures } from '@/components/PropertyFeatures';
import { TourViewer } from '@/components/TourViewer';
import { formatPrice, formatAddress } from '@/utils/format';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { properties, toggleFavorite, isFavorite, addToRecentlyViewed } = usePropertyStore();
  const [tourModalVisible, setTourModalVisible] = useState(false);
  
  const property = properties.find(p => p.id === id);
  const favorite = property ? isFavorite(property.id) : false;

  useEffect(() => {
    if (property) {
      addToRecentlyViewed(property.id);
    }
  }, [property?.id]);

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Property not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        alert('Sharing is not available on web');
        return;
      }
      
      await Share.share({
        title: `${property.address} - ${formatPrice(property.price)}`,
        message: `Check out this ${property.beds} bed, ${property.baths} bath property: ${formatAddress(property)}`,
      });
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };

  const handleContact = () => {
    // In a real app, this would open a contact form or initiate a call
    alert('Contact feature would be implemented here');
  };

  const openMap = () => {
    const address = formatAddress(property);
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
      web: `https://maps.google.com/?q=${address}`,
    });
    
    if (url) {
      Linking.openURL(url);
    }
  };

  const openTour = () => {
    setTourModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PropertyImageGallery images={property.images} />
        
        <View style={styles.content}>
          {/* Price and Actions */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(property.price)}</Text>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => toggleFavorite(property.id)}
              >
                <Heart 
                  size={22} 
                  color={favorite ? colors.favorite : colors.text}
                  fill={favorite ? colors.favorite : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Basic Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Bed size={20} color={colors.primary} />
              <Text style={styles.infoText}>{property.beds} Beds</Text>
            </View>
            <View style={styles.infoItem}>
              <Bath size={20} color={colors.primary} />
              <Text style={styles.infoText}>{property.baths} Baths</Text>
            </View>
            <View style={styles.infoItem}>
              <Square size={20} color={colors.primary} />
              <Text style={styles.infoText}>{property.sqm.toLocaleString()} sqft</Text>
            </View>
          </View>
          
          {/* Address */}
          <TouchableOpacity style={styles.addressContainer} onPress={openMap}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.address}>{formatAddress(property)}</Text>
          </TouchableOpacity>
          
          {/* 3D Tour Button */}
          {property.has3DTour && property.tourRooms && (
            <TouchableOpacity style={styles.tourButton} onPress={openTour}>
              <Box size={20} color="white" />
              <Text style={styles.tourButtonText}>Take 3D Tour</Text>
            </TouchableOpacity>
          )}
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
          
          {/* Features */}
          <PropertyFeatures property={property} />
          
          {/* Listed Date */}
          <View style={styles.listedDateContainer}>
            <Text style={styles.listedDateText}>
              Listed on {new Date(property.listedDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Contact Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonText}>Contact Agent</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Tour Modal */}
      {property.has3DTour && property.tourRooms && (
        <Modal
          visible={tourModalVisible}
          animationType="slide"
          onRequestClose={() => setTourModalVisible(false)}
        >
          <TourViewer 
            rooms={property.tourRooms} 
            onClose={() => setTourModalVisible(false)} 
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 6,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  address: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  tourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  tourButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  listedDateContainer: {
    marginTop: 16,
    marginBottom: 80,
  },
  listedDateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});