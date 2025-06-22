import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';


export default function Index() {
  

  const { isAuthenticated, isGuest, hasSelectedRole, user } = useAuthStore();
  
  // If user is not authenticated and not a guest, redirect to welcome
  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/(auth)/welcome" />;
  }
  
  // If user is authenticated but hasn't selected a role, redirect to role selection
  if ((isAuthenticated || isGuest) && !hasSelectedRole) {
    return <Redirect href="/(auth)/role-selection" />;
  }
  
  // If user is in seller mode, redirect to seller dashboard
  if (user?.isSeller && user?.sellerModeActive) {
    return <Redirect href="/seller/(tabs)" />;
  }
  
  // Otherwise, redirect to main tabs (buyer mode)
  return <Redirect href="/(tabs)" />;
}