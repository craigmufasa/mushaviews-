import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/user';
import * as firebaseAuth from 'firebase/auth';

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  addDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA4JfWvsw3cem_8XThLOXa76WqTNG2BapY",
  authDomain: "musha-views.firebaseapp.com",
  projectId: "musha-views",
  storageBucket: "musha-views.firebasestorage.app",
  messagingSenderId: "9639081594",
  appId: "1:9639081594:web:fde69a60cf2ed0d5702dc3",
  measurementId: "G-RRFG7DKZVM"
};

// Initialize Firebase app only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
 const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

// Initialize Auth with AsyncStorage persistence
let auth: Auth;
try {
  // Try to initialize auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: reactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  console.log('Auth already initialized, getting existing instance');
  auth = getAuth(app);
}

const db = getFirestore(app);

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;
  hasSelectedRole: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  upgradeToSeller: () => Promise<boolean>;
  toggleSellerMode: () => Promise<boolean>;
  continueAsGuest: () => void;
  checkAuth: () => Promise<boolean>;
  setHasSelectedRole: (value: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isGuest: false,
      hasSelectedRole: false,
      
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isGuest: user?.id === 'guest'
        });
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!userDoc.exists()) {
            throw new Error('User profile not found');
          }
          
          const userData = userDoc.data() as User;
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false, 
            isGuest: false,
            hasSelectedRole: false,
          });
          
          return true;
        } catch (error: any) {
          console.error('Login error in store:', error);
          let errorMessage = 'Failed to login';
          
          // Handle Firebase Auth specific errors
          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email address';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many failed attempts. Please try again later';
              break;
            default:
              errorMessage = error.message || 'Failed to login';
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return false;
        }
      },
      
      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const newUser: User = {
            id: firebaseUser.uid,
            name,
            email: email.toLowerCase(),
            isSeller: false,
            sellerModeActive: false,
            createdAt: new Date().toISOString(),
          };
          
          // Save user profile to Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          
          set({ 
            user: newUser, 
            isAuthenticated: true, 
            isLoading: false, 
            isGuest: false,
            hasSelectedRole: false,
          });
          
          return true;
        } catch (error: any) {
          console.error('Signup error in store:', error);
          let errorMessage = 'Failed to sign up';
          
          // Handle Firebase Auth specific errors
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'An account with this email already exists';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address';
              break;
            case 'auth/weak-password':
              errorMessage = 'Password should be at least 6 characters';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Email/password accounts are not enabled';
              break;
            default:
              errorMessage = error.message || 'Failed to sign up';
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return false;
        }
      },
      
      logout: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await signOut(auth);
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            isGuest: false,
            hasSelectedRole: false,
          });
        } catch (error: any) {
          console.error('Logout error in store:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to logout' 
          });
        }
      },
      
      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await sendPasswordResetEmail(auth, email);
          
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Reset password error in store:', error);
          let errorMessage = 'Failed to reset password';
          
          // Handle Firebase Auth specific errors
          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email address';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address';
              break;
            default:
              errorMessage = error.message || 'Failed to reset password';
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return false;
        }
      },
      
      updateProfile: async (data: Partial<User>) => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          const { user } = state;
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          if (user.id === 'guest') {
            throw new Error('Cannot update guest profile');
          }
          
          // Update user data in Firestore
          await updateDoc(doc(db, 'users', user.id), data);
          
          const updatedUser = { ...user, ...data };
          
          set({ 
            user: updatedUser, 
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          console.error('Update profile error in store:', error);
          
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile' 
          });
          return false;
        }
      },
      
      upgradeToSeller: async () => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          const { user } = state;
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          if (user.id === 'guest') {
            throw new Error('Guests cannot become sellers');
          }
          
          // Update user to seller in Firestore
          await updateDoc(doc(db, 'users', user.id), { 
            isSeller: true, 
            sellerModeActive: true 
          });
          
          const updatedUser = { 
            ...user, 
            isSeller: true, 
            sellerModeActive: true 
          };
          
          set({ 
            user: updatedUser, 
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          console.error('Upgrade to seller error in store:', error);
          
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to upgrade to seller' 
          });
          return false;
        }
      },
      
      toggleSellerMode: async () => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          const { user } = state;
          if (!user || !user.isSeller) {
            throw new Error('User is not a seller');
          }
          
          if (user.id === 'guest') {
            throw new Error('Guests cannot toggle seller mode');
          }
          
          // Toggle seller mode in Firestore
          await updateDoc(doc(db, 'users', user.id), { 
            sellerModeActive: !user.sellerModeActive 
          });
          
          const updatedUser = { 
            ...user, 
            sellerModeActive: !user.sellerModeActive 
          };
          
          set({ user: updatedUser, isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Toggle seller mode error in store:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to toggle seller mode' 
          });
          return false;
        }
      },
      
      continueAsGuest: () => {
        set({
          user: {
            id: 'guest',
            name: 'Guest',
            email: '',
            isSeller: false,
            sellerModeActive: false,
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isGuest: true,
          hasSelectedRole: false,
        });
      },
      
      checkAuth: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Return a promise that resolves when auth state is determined
          return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              try {
                if (firebaseUser) {
                  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                  if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    set({ 
                      user: userData, 
                      isAuthenticated: true, 
                      isLoading: false,
                      isGuest: false 
                    });
                    resolve(true);
                  } else {
                    // User exists in Auth but not in Firestore
                    set({ 
                      user: null, 
                      isAuthenticated: false, 
                      isLoading: false,
                      isGuest: false 
                    });
                    resolve(false);
                  }
                } else {
                  // Check if user was previously a guest
                  const state = get();
                  if (state.isGuest && state.user?.id === 'guest') {
                    set({ isLoading: false });
                    resolve(true);
                  } else {
                    set({ 
                      user: null, 
                      isAuthenticated: false, 
                      isLoading: false,
                      isGuest: false,
                      hasSelectedRole: false
                    });
                    resolve(false);
                  }
                }
              } catch (error) {
                console.error('Auth state change error:', error);
                set({ 
                  user: null,
                  isAuthenticated: false,
                  isLoading: false, 
                  error: 'Failed to check authentication',
                  isGuest: false,
                  hasSelectedRole: false
                });
                resolve(false);
              }
              unsubscribe();
            });
          });
        } catch (error: any) {
          console.error('Check auth error:', error);
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false, 
            error: error.message || 'Failed to check authentication',
            isGuest: false,
            hasSelectedRole: false
          });
          return false;
        }
      },
      
      setHasSelectedRole: (value: boolean) => {
        set({ hasSelectedRole: value });
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        hasSelectedRole: state.hasSelectedRole,
      }),
    }
  )
);

// Auth state listener setup
// Call this in your app's root component or _layout.tsx
export const initializeAuthListener = () => {
  const { setUser } = useAuthStore.getState();
  
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
        } else {
          // User exists in Auth but not in Firestore - this shouldn't happen
          console.warn('User exists in Auth but not in Firestore');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      }
    } else {
      // Don't automatically clear guest users
      const state = useAuthStore.getState();
      if (!state.isGuest) {
        setUser(null);
      }
    }
  });
};

// Export auth and db for use in other parts of the app if needed
export { auth, db };