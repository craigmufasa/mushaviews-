import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Plus, Home, Edit, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { usePropertyStore } from '@/store/property-store';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { EmptyState } from '@/components/EmptyState';

export default function SellerPropertiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchSellerProperties, deleteProperty, isLoading, clearError } = usePropertyStore();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProperties = async () => {
    if (!user || user.id === 'guest') return;
    
    try {
      clearError();
      const sellerProperties = await fetchSellerProperties(user.id);
      setProperties(sellerProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handleAddProperty = () => {
    router.push('/seller/add-property');
  };

  const handleEditProperty = (property: Property) => {
    router.push(`/seller/edit-property/${property.id}`);
  };

  const handleDeleteProperty = async (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProperty(property.id);
            if (success) {
              // Refresh the properties list
              await loadProperties();
            }
          },
        },
      ]
    );
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/property/${property.id}`);
  };

  if (isLoading && properties.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'My Properties',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddProperty} style={styles.addButton}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {properties.length === 0 ? (
          <EmptyState
            icon={<Home size={48} color={colors.textLight} />}
            title="No properties yet"
            description="Start by adding your first property to showcase to potential buyers."
            actionText="Add Property"
            onAction={handleAddProperty}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>My Properties</Text>
              <Text style={styles.subtitle}>
                {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </Text>
            </View>

            {properties.map((property) => (
              <View key={property.id} style={styles.propertyContainer}>
                <PropertyCard 
                  property={property} 
                  onPress={() => handlePropertyPress(property)}
                />
                <View style={styles.propertyActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProperty(property)}
                  >
                    <Edit size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProperty(property)}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  addButton: {
    padding: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  propertyContainer: {
    marginBottom: 16,
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  deleteButtonText: {
    color: colors.error,
  },
});