import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { 
  User, 
  Heart, 
  Clock, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Building,
  Home,
  ArrowRight
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";

export default function SellerProfileScreen() {
  const router = useRouter();
  const { user, logout, toggleSellerMode } = useAuthStore();
  const [switchingMode, setSwitchingMode] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleToggleSellerMode = async () => {
    if (!user?.isSeller) return;
    
    setSwitchingMode(true);
    try {
      const success = await toggleSellerMode();
      if (success) {
        // User is switching from seller mode to buyer mode
        Alert.alert(
          "Switched to Buyer Mode", 
          "You are now browsing as a buyer.",
          [
            { 
              text: "Go to Buyer App", 
              onPress: () => router.replace('/(tabs)') 
            }
          ]
        );
        router.replace('/(tabs)');
      } else {
        Alert.alert("Error", "Failed to switch modes. Please try again.");
      }
    } catch (error) {
      console.error('Error switching modes:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again later.");
    } finally {
      setSwitchingMode(false);
    }
  };

  const navigateToBuyerApp = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: "Profile" }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.sellerBadge}>
              <Building size={14} color={colors.secondary} />
              <Text style={styles.sellerBadgeText}>Seller</Text>
            </View>
          </View>
        </View>
        
        {/* Seller Mode Toggle */}
        <View style={styles.sellerModeContainer}>
          <View style={styles.sellerModeHeader}>
            <Building size={20} color={colors.secondary} />
            <Text style={styles.sellerModeTitle}>Seller Mode</Text>
          </View>
          
          <View style={styles.sellerModeToggleContainer}>
            <Text style={styles.sellerModeText}>
              Currently in seller mode
            </Text>
            
            <Switch
              trackColor={{ false: colors.border, true: colors.secondaryLight }}
              thumbColor={colors.secondary}
              ios_backgroundColor={colors.border}
              onValueChange={handleToggleSellerMode}
              value={true}
              disabled={switchingMode}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.buyerAppButton} 
            onPress={navigateToBuyerApp}
          >
            <Text style={styles.buyerAppButtonText}>Switch to Buyer Mode</Text>
            <Home size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Seller Tools</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/seller/(tabs)')}
          >
            <View style={styles.menuItemLeft}>
              <Building size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>My Properties</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/seller/add-property')}
          >
            <View style={styles.menuItemLeft}>
              <Building size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Add New Property</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Account Settings</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Bell size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <HelpCircle size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Sign Out</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2023 RealEstate App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  sellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 209, 178, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  sellerBadgeText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  sellerModeContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sellerModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sellerModeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sellerModeText: {
    fontSize: 14,
    color: colors.text,
  },
  buyerAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  buyerAppButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
});