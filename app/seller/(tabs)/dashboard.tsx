import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { 
  Building, 
  Eye, 
  Heart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Plus,
  Box
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import { formatPrice } from "@/utils/format";
import { Property } from "@/types/property";

const { width } = Dimensions.get('window');

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchSellerProperties, properties, isLoading } = usePropertyStore();
  
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalFavorites: 0,
    averagePrice: 0,
    with3DTour: 0
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    if (!user) return;
    
    try {
      const properties = await fetchSellerProperties(user.id);
      setSellerProperties(properties);
      
      // Calculate stats
      if (properties.length > 0) {
        const totalPrice = properties.reduce((sum, prop) => sum + prop.price, 0);
        const with3DTour = properties.filter(prop => prop.has3DTour).length;
        
        // In a real app, these would come from the backend
        const totalViews = Math.floor(Math.random() * 1000) + 100;
        const totalFavorites = Math.floor(Math.random() * 100) + 10;
        
        setStats({
          totalListings: properties.length,
          totalViews,
          totalFavorites,
          averagePrice: totalPrice / properties.length,
          with3DTour
        });
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handleAddProperty = () => {
    router.push('/seller/add-property');
  };

  const handleManageProperties = () => {
    router.push('/seller/(tabs)');
  };

  const handleAdd3DTour = () => {
    router.push('/seller/add-3d-tour');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          title: "Seller Dashboard",
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.sellerBadge}>
            <Building size={16} color={colors.secondary} />
            <Text style={styles.sellerBadgeText}>Seller</Text>
          </View>
        </View>
        
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Building size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalListings}</Text>
              <Text style={styles.statLabel}>Active Listings</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Eye size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalViews}</Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Heart size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalFavorites}</Text>
              <Text style={styles.statLabel}>Saved by Users</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <DollarSign size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{formatPrice(stats.averagePrice)}</Text>
              <Text style={styles.statLabel}>Avg. Price</Text>
            </View>
          </View>
        </View>
        
        {/* 3D Tour Stats */}
        <View style={styles.tourStatsContainer}>
          <View style={styles.tourStatsContent}>
            <View style={styles.tourStatsTextContainer}>
              <Text style={styles.tourStatsTitle}>3D Tour Performance</Text>
              <Text style={styles.tourStatsDescription}>
                Properties with 3D tours get 2x more views and inquiries
              </Text>
              <View style={styles.tourStatsNumbers}>
                <Text style={styles.tourStatsValue}>{stats.with3DTour}</Text>
                <Text style={styles.tourStatsLabel}>of {stats.totalListings} listings have 3D tours</Text>
              </View>
            </View>
            <View style={styles.tourStatsIconContainer}>
              <Box size={40} color={colors.secondary} />
            </View>
          </View>
          <TouchableOpacity style={styles.addTourButton} onPress={handleAdd3DTour}>
            <Text style={styles.addTourButtonText}>Add 3D Tour</Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddProperty}>
              <Plus size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Add Property</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleManageProperties}>
              <Building size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Manage Listings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleAdd3DTour}>
              <Box size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Add 3D Tour</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {sellerProperties.length > 0 ? (
            <View style={styles.activityList}>
              {sellerProperties.slice(0, 3).map((property, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <Eye size={16} color={colors.textLight} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityHighlight}>{Math.floor(Math.random() * 20) + 5}</Text> new views on your property at <Text style={styles.activityHighlight}>{property.address}</Text>
                    </Text>
                    <Text style={styles.activityTime}>Today</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivityContainer}>
              <Text style={styles.emptyActivityText}>No recent activity to show</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    padding: 8,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  sellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  sellerBadgeText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  tourStatsContainer: {
    margin: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tourStatsContent: {
    flexDirection: 'row',
    padding: 16,
  },
  tourStatsTextContainer: {
    flex: 1,
  },
  tourStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tourStatsDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  tourStatsNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tourStatsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  tourStatsLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  tourStatsIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  addTourButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addTourButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 48) / 3,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  recentActivityContainer: {
    padding: 16,
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  activityHighlight: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyActivityContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: colors.textLight,
  },
});