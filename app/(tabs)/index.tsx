import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Search, SlidersHorizontal, Box } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterModal } from "@/components/FilterModal";
import { usePropertyStore } from "@/store/property-store";

export default function HomeScreen() {
  const router = useRouter();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { properties, recentlyViewed, updateFilter } = usePropertyStore();
  
  const recentlyViewedProperties = recentlyViewed
    .map(id => properties.find(p => p.id === id))
    .filter(Boolean);

  const featuredProperties = properties.filter(p => p.status === 'for_sale').slice(0, 5);
  const rentalProperties = properties.filter(p => p.status === 'for_rent');
  const propertiesWith3DTour = properties.filter(p => p.has3DTour);

  const navigateToSearch = () => {
    router.push('/search');
  };

  const showOnly3DTours = () => {
    updateFilter({ has3DTour: true });
    router.push('/search');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Find your</Text>
            <Text style={styles.titleText}>Perfect Home</Text>
          </View>
          <TouchableOpacity style={styles.locationButton}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.locationText}>Harare</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={navigateToSearch}>
          <Search size={20} color={colors.textLight} />
          <Text style={styles.searchPlaceholder}>Search by city, address, or ZIP</Text>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setFilterModalVisible(true)}
          >
            <SlidersHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* 3D Tour Banner */}
        {propertiesWith3DTour.length > 0 && (
          <TouchableOpacity style={styles.tourBanner} onPress={showOnly3DTours}>
            <View style={styles.tourBannerIcon}>
              <Box size={24} color={colors.secondary} />
            </View>
            <View style={styles.tourBannerContent}>
              <Text style={styles.tourBannerTitle}>3D Home Tours</Text>
              <Text style={styles.tourBannerText}>
                Explore homes from the comfort of your couch
              </Text>
            </View>
            <Text style={styles.tourBannerAction}>View All</Text>
          </TouchableOpacity>
        )}

        {/* Recently Viewed */}
        {recentlyViewedProperties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recentlyViewedProperties.map((property) => (
                <View key={property.id} style={styles.recentCard}>
                  <PropertyCard property={property} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity onPress={navigateToSearch}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.propertiesList}>
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        </View>

        {/* Rentals */}
        {rentalProperties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available for Rent</Text>
              <TouchableOpacity onPress={navigateToSearch}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.propertiesList}>
              {rentalProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <FilterModal 
        visible={filterModalVisible} 
        onClose={() => setFilterModalVisible(false)} 
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 8,
    color: colors.textLight,
    fontSize: 16,
  },
  filterButton: {
    padding: 4,
  },
  tourBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  tourBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tourBannerContent: {
    flex: 1,
  },
  tourBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tourBannerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  tourBannerAction: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  horizontalList: {
    paddingRight: 16,
  },
  recentCard: {
    width: 280,
    marginRight: 16,
  },
  propertiesList: {
    marginBottom: 16,
  },
});