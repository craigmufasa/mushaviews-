import React from "react";
import { StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { usePropertyStore } from "@/store/property-store";

export default function SavedScreen() {
  const router = useRouter();
  const { properties, favoriteIds } = usePropertyStore();
  
  const favoriteProperties = properties.filter(property => 
    favoriteIds.includes(property.id)
  );

  const navigateToHome = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: "Saved Homes" }} />
      
      {favoriteProperties.length > 0 ? (
        <FlatList
          data={favoriteProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState 
          type="favorites" 
          onAction={navigateToHome} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
});