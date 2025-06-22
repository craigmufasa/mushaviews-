import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/constants/colors';

export default function SellerLayout() {
  const { user, isAuthenticated, isGuest, hasSelectedRole } = useAuthStore();
  
  // If user is not authenticated and not a guest, redirect to auth
  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/(auth)/welcome" />;
  }
  
  // If user hasn't selected a role yet, redirect to role selection
  if ((isAuthenticated || isGuest) && !hasSelectedRole) {
    return <Redirect href="/(auth)/role-selection" />;
  }
  
  // If user is not a seller or not in seller mode, redirect to main app
  if (!user?.isSeller || !user?.sellerModeActive) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="add-property" 
        options={{ 
          title: 'Add Property',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="edit-property" 
        options={{ 
          title: 'Edit Property',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="add-3d-tour" 
        options={{ 
          title: 'Add 3D Tour',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="add-3d-model" 
        options={{ 
          title: 'Add 3D Model',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}