import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Plus, Building, Edit, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import { Property } from "@/types/property";
import { formatPrice } from "@/utils/format";

export default function SellerPropertiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchSellerProperties, deleteProperty, isLoading } = usePropertyStore();
  
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
      setProperties(sellerProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load your properties');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddProperty = () => {
    router.push('/seller/add-property');
  };

  const handleEditProperty = (propertyId: string) => {
    router.push(`/seller/edit-property/${propertyId}`);
  };

  const handleDeleteProperty = (propertyId: string) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              // Refresh the list
              loadProperties();
            } catch (error) {
              console.error('Error deleting property:', error);
              Alert.alert('Error', 'Failed to delete property');
            }
          }
        },
      ]
    );
  };

  const navigateToDashboard = () => {
    router.push('/seller/dashboard');
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <View style={styles.propertyItem}>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyAddress} numberOfLines={1}>{item.address}</Text>
        <Text style={styles.propertyPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.propertyDetails}>
          {item.beds} bd • {item.baths} ba • {item.sqft.toLocaleString()} sqft
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status === 'for_sale' ? 'For Sale' : 'For Rent'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEditProperty(item.id)}
        >
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteProperty(item.id)}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          title: "My Properties",
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={navigateToDashboard}
        >
          <Building size={20} color={colors.primary} />
          <Text style={styles.dashboardButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Listed Properties</Text>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't listed any properties yet</Text>
              <TouchableOpacity 
                style={styles.addPropertyButton} 
                onPress={handleAddProperty}
              >
                <Text style={styles.addPropertyButtonText}>Add Your First Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderPropertyItem}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  dashboardButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  actionButtons: {
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
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
  addPropertyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addPropertyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});