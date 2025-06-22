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
  LogIn,
  ArrowRight
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, upgradeToSeller, isLoading, isGuest, toggleSellerMode } = useAuthStore();
  const [upgrading, setUpgrading] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleSignup = () => {
    router.push('/(auth)/signup');
  };

  const handleUpgradeToSeller = async () => {
    if (!user) return;
    
    setUpgrading(true);
    try {
      const success = await upgradeToSeller();
      if (success) {
        Alert.alert(
          "Success", 
          "Your account has been upgraded to a seller account. You can now list properties for sale or rent.",
          [
            { 
              text: "Go to Seller Dashboard", 
              onPress: () => router.push('/seller') 
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to upgrade your account. Please try again.");
      }
    } catch (error) {
      console.error('Error upgrading to seller:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again later.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleToggleSellerMode = async () => {
    if (!user?.isSeller) return;
    
    setSwitchingMode(true);
    try {
      const success = await toggleSellerMode();
      if (success) {
        if (user.sellerModeActive) {
          // User was in seller mode and is now switching to buyer mode
          Alert.alert("Switched to Buyer Mode", "You are now browsing as a buyer.");
          router.replace('/(tabs)');
        } else {
          // User was in buyer mode and is now switching to seller mode
          Alert.alert(
            "Switched to Seller Mode", 
            "You are now in seller mode.",
            [
              { 
                text: "Go to Seller Dashboard", 
                onPress: () => router.push('/seller') 
              }
            ]
          );
          router.replace('/seller');
        }
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

  const navigateToSellerDashboard = () => {
    router.push('/seller');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: "Profile" }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user ? (
              user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              )
            ) : (
              <User size={40} color={colors.primary} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user ? user.name : isGuest ? "Guest User" : "Sign In"}
            </Text>
            <Text style={styles.profileEmail}>
              {user ? user.email : isGuest ? "Browse without an account" : "Sign in to save your preferences"}
            </Text>
            {user?.isSeller && (
              <View style={styles.sellerBadge}>
                <Building size={14} color={colors.secondary} />
                <Text style={styles.sellerBadgeText}>Seller</Text>
              </View>
            )}
          </View>
        </View>
        
        {!user && !isGuest && (
          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInButtonText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        )}

        {isGuest && (
          <View style={styles.guestButtonsContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignup}>
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Seller Upgrade or Mode Toggle */}
        {user && !user.isSeller && (
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={handleUpgradeToSeller}
            disabled={upgrading}
          >
            {upgrading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Building size={18} color="white" />
                <Text style={styles.upgradeButtonText}>Become a Seller</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Seller Mode Toggle */}
        {user?.isSeller && (
          <View style={styles.sellerModeContainer}>
            <View style={styles.sellerModeHeader}>
              <Building size={20} color={colors.secondary} />
              <Text style={styles.sellerModeTitle}>Seller Mode</Text>
            </View>
            
            <View style={styles.sellerModeToggleContainer}>
              <Text style={styles.sellerModeText}>
                {user.sellerModeActive ? "Currently in seller mode" : "Currently in buyer mode"}
              </Text>
              
              <Switch
                trackColor={{ false: colors.border, true: colors.secondaryLight }}
                thumbColor={user.sellerModeActive ? colors.secondary : colors.textLight}
                ios_backgroundColor={colors.border}
                onValueChange={handleToggleSellerMode}
                value={user.sellerModeActive}
                disabled={switchingMode}
              />
            </View>
            
            {user.sellerModeActive && (
              <TouchableOpacity 
                style={styles.sellerDashboardButton} 
                onPress={navigateToSellerDashboard}
              >
                <Text style={styles.sellerDashboardButtonText}>Go to Seller Dashboard</Text>
                <ArrowRight size={16} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/saved')}
          >
            <View style={styles.menuItemLeft}>
              <Heart size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Saved Homes</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Clock size={20} color={colors.textLight} />
              <Text style={styles.menuItemText}>Recently Viewed</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          {user?.isSeller && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/seller')}
            >
              <View style={styles.menuItemLeft}>
                <Building size={20} color={colors.textLight} />
                <Text style={styles.menuItemText}>Seller Dashboard</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
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
          
          {user && (
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <LogOut size={20} color={colors.textLight} />
                <Text style={styles.menuItemText}>Sign Out</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}

          {isGuest && (
            <TouchableOpacity style={styles.menuItem} onPress={handleLogin}>
              <View style={styles.menuItemLeft}>
                <LogIn size={20} color={colors.textLight} />
                <Text style={styles.menuItemText}>Sign In</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
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
  signInButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButtonsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  sellerDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 209, 178, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  sellerDashboardButtonText: {
    color: colors.secondary,
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