import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Box, Plus, Eye } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import { Property } from "@/types/property";

export default function Seller3DToursScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchSellerProperties, isLoading } = usePropertyStore();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      const sellerProperties = await fetchSellerProperties(user.id);
      // Filter properties with 3D tours
      const propertiesWith3DTour = sellerProperties.filter(p => p.has3DTour);
      setProperties(propertiesWith3DTour);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTour = () => {
    router.push('/seller/add-3d-tour');
  };

  const handleViewTour = (propertyId: string) => {
    router.push(`/tour/${propertyId}`);
  };

  const renderTourItem = ({ item }: { item: Property }) => (
    <View style={styles.tourItem}>
      <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
      <View style={styles.tourBadge}>
        <Box size={14} color="white" />
        <Text style={styles.tourBadgeText}>3D Tour</Text>
      </View>
      <View style={styles.tourInfo}>
        <Text style={styles.propertyAddress} numberOfLines={1}>{item.address}</Text>
        <Text style={styles.propertyDetails}>
          {item.beds} bd • {item.baths} ba • {item.sqft.toLocaleString()} sqft
        </Text>
        <TouchableOpacity 
          style={styles.viewTourButton}
          onPress={() => handleViewTour(item.id)}
        >
          <Eye size={16} color={colors.secondary} />
          <Text style={styles.viewTourText}>View Tour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          title: "3D Tours",
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddTour}>
              <Plus size={24} color={colors.secondary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Box size={24} color={colors.secondary} />
        </View>
        <Text style={styles.headerText}>
          Create immersive 3D tours to showcase your properties
        </Text>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <>
          {properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't created any 3D tours yet</Text>
              <TouchableOpacity 
                style={styles.addTourButton} 
                onPress={handleAddTour}
              >
                <Text style={styles.addTourButtonText}>Create Your First 3D Tour</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderTourItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={loadProperties}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  tourItem: {
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
  propertyImage: {
    width: '100%',
    height: 180,
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
  tourBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tourInfo: {
    padding: 16,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  viewTourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  viewTourText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  addTourButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addTourButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});