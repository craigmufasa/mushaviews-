import React from "react";
import { Tabs } from "expo-router";
import { Home, Search, Heart, User, Box } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import { Redirect } from "expo-router";

export default function TabLayout() {
  const { isAuthenticated, isGuest, hasSelectedRole, user } = useAuthStore();
  
  // If user is not authenticated and not a guest, redirect to auth
  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/(auth)/welcome" />;
  }
  
  // If user hasn't selected a role yet, redirect to role selection
  if ((isAuthenticated || isGuest) && !hasSelectedRole) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  // If user is in seller mode, redirect to seller dashboard
  if (user?.isSeller && user?.sellerModeActive) {
    return <Redirect href="/seller/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.text,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="3dtours"
        options={{
          title: "3D Tours",
          tabBarIcon: ({ color }) => <Box size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}