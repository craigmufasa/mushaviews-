import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { initializeAuthListener } from '@/store/auth-store';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
  const unsubscribe = initializeAuthListener();
  return unsubscribe; // Cleanup on unmount
}, []);
  const { checkAuth } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for fonts to load
        if (!loaded) {
          return;
        }

        console.log('Initializing app...');
        
        // Check authentication
        await checkAuth();
        
        console.log('App initialization completed');
        setAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue anyway to prevent app from being stuck
        setAppReady(true);
      }
    };
    
    initializeApp();
  }, [loaded, checkAuth]);

  useEffect(() => {
    if (appReady) {
      console.log('App ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return <Slot />;
}