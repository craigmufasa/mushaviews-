import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { useAuthStore,} from "@/store/auth-store";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated, hasSelectedRole, user } = useAuthStore();
  
  // If user is authenticated and has selected a role
  if (isAuthenticated && hasSelectedRole && user) {
    // If user is in seller mode, redirect to seller dashboard
    if (user.isSeller && user.sellerModeActive) {
      return <Redirect href="/seller" />;
    }
    // Otherwise redirect to tabs
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
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Log In" }} />
      <Stack.Screen name="signup" options={{ title: "Create Account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset Password" }} />
      <Stack.Screen name="role-selection" options={{ 
        title: "Choose Role",
        headerBackVisible: false
      }} />
    </Stack>
  );
}