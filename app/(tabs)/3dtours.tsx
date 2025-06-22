import React from "react";
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Box } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { usePropertyStore } from "@/store/property-store";

export default function TourScreen() {
  const router = useRouter();
  const { properties } = usePropertyStore();
  
  const propertiesWith3DTour = properties.filter(property => property.has3DTour);

  const navigateToHome = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: "3D Home Tours" }} />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Box size={24} color={colors.secondary} />
        </View>
        <Text style={styles.headerText}>
          Explore homes virtually with our immersive 3D tours
        </Text>
      </View>
      
      {propertiesWith3DTour.length > 0 ? (
        <FlatList
          data={propertiesWith3DTour}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState 
          type="search" 
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
  listContent: {
    padding: 16,
  },
});