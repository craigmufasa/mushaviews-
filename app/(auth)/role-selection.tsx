import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Building, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, updateProfile, setHasSelectedRole, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    setError(null);
    clearError();
    
    try {
      if (selectedRole === 'seller') {
        // If user selected seller role
        if (user && user.id !== 'guest') {
          // Update their profile to be a seller with seller mode active
          const success = await updateProfile({ 
            isSeller: true,
            sellerModeActive: true // Automatically activate seller mode
          });
          
          if (!success) {
            throw new Error('Failed to update user profile');
          }
        }
        
        // Mark that user has selected a role
        setHasSelectedRole(true);
        
        // Navigate to the seller dashboard using replace to prevent going back
        router.replace('/seller/(tabs)');
      } else {
        // For buyer role
        if (user && user.id !== 'guest') {
          // Ensure seller mode is inactive if they're a seller
          if (user.isSeller) {
            const success = await updateProfile({ sellerModeActive: false });
            if (!success) {
              throw new Error('Failed to update user profile');
            }
          }
        }
        
        // Mark that user has selected a role
        setHasSelectedRole(true);
        
        // Navigate to the main app using replace to prevent going back
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Error setting role:', err);
      setError(err.message || 'Failed to set role. Please try again.');
      Alert.alert('Error', err.message || 'Failed to set role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use Musha Views?</Text>
          <Text style={styles.subtitle}>
            Select your primary role to personalize your experience
          </Text>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'buyer' && styles.selectedRoleCard
            ]}
            onPress={() => setSelectedRole('buyer')}
          >
            <View style={styles.roleIconContainer}>
              <Home size={32} color={colors.primary} />
            </View>
            <Text style={styles.roleName}>I'm looking to buy or rent</Text>
            <Text style={styles.roleDescription}>
              Browse listings, save favorites, and contact sellers
            </Text>
            {selectedRole === 'buyer' && (
              <View style={styles.checkmarkContainer}>
                <Check size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'seller' && styles.selectedRoleCard
            ]}
            onPress={() => setSelectedRole('seller')}
          >
            <View style={styles.roleIconContainer}>
              <Building size={32} color={colors.secondary} />
            </View>
            <Text style={styles.roleName}>I'm looking to sell or rent out</Text>
            <Text style={styles.roleDescription}>
              List properties, manage inquiries, and track performance
            </Text>
            {selectedRole === 'seller' && (
              <View style={styles.checkmarkContainer}>
                <Check size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.disabledButton,
            isLoading && styles.loadingButton
          ]}
          onPress={handleRoleSelection}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.noteText}>
          You can always change your role later in settings
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  roleContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  selectedRoleCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingButton: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textLight,
  },
});