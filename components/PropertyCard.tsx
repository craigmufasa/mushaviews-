import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Box } from 'lucide-react-native';
import { Property } from '@/types/property';
import { formatPrice } from '@/utils/format';
import { colors } from '@/constants/colors';
import { usePropertyStore } from '@/store/property-store';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const router = useRouter();
  const { toggleFavorite, isFavorite, addToRecentlyViewed } = usePropertyStore();
  const favorite = isFavorite(property.id);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      addToRecentlyViewed(property.id);
      router.push(`/property/${property.id}`);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: property.images[0] }} style={styles.image} />
        <Pressable 
          style={styles.favoriteButton} 
          onPress={handleFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={22}
            color={favorite ? colors.favorite : 'white'}
            fill={favorite ? colors.favorite : 'transparent'}
          />
        </Pressable>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {property.status === 'for_sale' ? 'For Sale' : 
             property.status === 'for_rent' ? 'For Rent' :
             property.status === 'sold' ? 'Sold' : 'Pending'}
          </Text>
        </View>
        
        {property.has3DTour && (
          <View style={styles.tourBadge}>
            <Box size={16} color="white" />
            <Text style={styles.tourText}>3D Tour</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        <View style={styles.specs}>
          <Text style={styles.specsText}>{property.beds} bd</Text>
          <Text style={styles.specsDivider}>|</Text>
          <Text style={styles.specsText}>{property.baths} ba</Text>
          <Text style={styles.specsDivider}>|</Text>
          <Text style={styles.specsText}>{property.sqm?.toLocaleString() || 'N/A'} sqm</Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {property.address}
        </Text>
        <Text style={styles.cityState} numberOfLines={1}>
          {property.city}, {property.state}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 50,
    padding: 8,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tourBadge: {
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
  tourText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  specs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specsText: {
    fontSize: 14,
    color: colors.textLight,
  },
  specsDivider: {
    marginHorizontal: 6,
    color: colors.textExtraLight,
  },
  address: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  cityState: {
    fontSize: 14,
    color: colors.textLight,
  },
});