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

export default function Seller3DModelsScreen() {
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
      // Filter properties with 3D models
      const propertiesWith3DModel = sellerProperties.filter(p => p.has3DModel);
      setProperties(propertiesWith3DModel);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddModel = () => {
    router.push('/seller/add-3d-model');
  };

  const handleViewModel = (propertyId: string) => {
    router.push(`/tour/${propertyId}`);
  };

  const renderModelItem = ({ item }: { item: Property }) => (
    <View style={styles.modelItem}>
      <Image 
        source={{ uri: item.models3D?.[0]?.thumbnailUrl || item.images[0] }} 
        style={styles.propertyImage} 
      />
      <View style={styles.modelBadge}>
        <Box size={14} color="white" />
        <Text style={styles.modelBadgeText}>3D Model</Text>
      </View>
      <View style={styles.modelInfo}>
        <Text style={styles.propertyAddress} numberOfLines={1}>{item.address}</Text>
        <Text style={styles.modelName}>
          {item.models3D?.[0]?.name || "3D Model"}
        </Text>
        
        {item.models3D?.[0]?.format && (
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>
              {item.models3D[0].format.replace('3d-model/', '').toUpperCase()}
            </Text>
          </View>
        )}
        
        {item.models3D?.[0]?.textureInfo && (
          <Text style={styles.textureInfo}>
            {item.models3D[0].textureInfo}
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.viewModelButton}
          onPress={() => handleViewModel(item.id)}
        >
          <Eye size={16} color={colors.primary} />
          <Text style={styles.viewModelText}>View Model</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          title: "3D Models",
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddModel}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Box size={24} color={colors.primary} />
        </View>
        <Text style={styles.headerText}>
          Upload 3D models (GLB/GLTF) with textures to give buyers a detailed view of your properties
        </Text>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't uploaded any 3D models yet</Text>
              <TouchableOpacity 
                style={styles.addModelButton} 
                onPress={handleAddModel}
              >
                <Text style={styles.addModelButtonText}>Upload Your First 3D Model</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderModelItem}
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
    backgroundColor: colors.primaryLight,
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
  modelItem: {
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
  modelBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modelInfo: {
    padding: 16,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  formatBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  formatBadgeText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  textureInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
  },
  viewModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  viewModelText: {
    fontSize: 14,
    color: colors.primary,
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
  addModelButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addModelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});