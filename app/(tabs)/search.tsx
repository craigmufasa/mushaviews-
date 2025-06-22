import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { FilterModal } from "@/components/FilterModal";
import { EmptyState } from "@/components/EmptyState";
import { usePropertyStore } from "@/store/property-store";

export default function SearchScreen() {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { getFilteredProperties, resetFilter, fetchProperties, isLoading, properties } = usePropertyStore();
  
  const filteredProperties = getFilteredProperties();

  useEffect(() => {
    // Fetch properties when the component mounts if we don't have any
    if (properties.length === 0) {
      fetchProperties();
    }
  }, []);

  if (isLoading && properties.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <SearchBar onFilterPress={() => setFilterModalVisible(true)} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <SearchBar onFilterPress={() => setFilterModalVisible(true)} />
      
      {filteredProperties.length > 0 ? (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState 
          type="search" 
          onAction={() => resetFilter()} 
        />
      )}
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
});