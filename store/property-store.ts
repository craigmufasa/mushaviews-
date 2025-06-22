import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property, PropertyFilter } from '@/types/property';

// FIREBASE INTEGRATION POINT 1: Firebase imports would go here
// import { initializeApp } from 'firebase/app';
// import { 
//   getFirestore, 
//   collection, 
//   doc, 
//   getDocs, 
//   getDoc,
//   addDoc, 
//   updateDoc, 
//   deleteDoc,
//   query, 
//   where, 
//   orderBy, 
//   limit,
//   onSnapshot,
//   Timestamp 
// } from 'firebase/firestore';
// import { 
//   getStorage, 
//   ref, 
//   uploadBytes, 
//   getDownloadURL,
//   deleteObject 
// } from 'firebase/storage';

// FIREBASE INTEGRATION POINT 2: Firebase config (same as auth-store)
// const firebaseConfig = { ... };
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const storage = getStorage(app);

interface PropertyState {
  properties: Property[];
  favoriteIds: string[];
  recentlyViewed: string[];
  filter: PropertyFilter;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  toggleFavorite: (id: string) => void;
  addToRecentlyViewed: (id: string) => void;
  updateFilter: (filter: Partial<PropertyFilter>) => void;
  resetFilter: () => void;
  getFilteredProperties: () => Property[];
  isFavorite: (id: string) => boolean;
  
  // Local property management
  fetchProperties: (forceRefresh?: boolean) => Promise<void>;
  fetchSellerProperties: (sellerId: string) => Promise<Property[]>;
  addProperty: (property: Omit<Property, 'id'>, images: string[]) => Promise<Property>;
  updateProperty: (id: string, property: Partial<Property>, newImages?: string[]) => Promise<Property>;
  deleteProperty: (id: string) => Promise<boolean>;
  getPropertyById: (id: string) => Promise<Property | null>;
  
  clearError: () => void;
}

// Mock properties database - FIREBASE INTEGRATION POINT 3: This would be replaced by Firestore
let mockProperties: Property[] = [
  {
    id: '1',
    sellerId: 'seller1',
    title: 'Modern Downtown Apartment',
    description: 'Beautiful modern apartment in the heart of downtown with stunning city views.',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    price: 850000,
    beds: 2,
    baths: 2,
    sqm: 95,
    type: 'apartment',
    status: 'for_sale',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    features: ['Balcony', 'Gym', 'Parking', 'Elevator'],
    has3DTour: true,
    has3DModel: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    sellerId: 'seller2',
    title: 'Cozy Suburban House',
    description: 'Perfect family home with a large backyard and quiet neighborhood.',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    price: 1200000,
    beds: 4,
    baths: 3,
    sqm: 180,
    type: 'house',
    status: 'for_sale',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ],
    features: ['Garden', 'Garage', 'Fireplace', 'Pool'],
    has3DTour: false,
    has3DModel: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    sellerId: 'seller1',
    title: 'Luxury Penthouse',
    description: 'Exclusive penthouse with panoramic views and premium amenities.',
    address: '789 Sky Tower',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    price: 2500000,
    beds: 3,
    baths: 3,
    sqm: 220,
    type: 'apartment',
    status: 'for_sale',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800'
    ],
    features: ['Rooftop Terrace', 'Concierge', 'Spa', 'Wine Cellar'],
    has3DTour: true,
    has3DModel: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  }
];

// Helper to generate property ID - FIREBASE INTEGRATION POINT 4: Firestore provides document IDs
const generatePropertyId = () => `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// FIREBASE INTEGRATION POINT 5: Image upload helper function
// const uploadPropertyImages = async (images: string[], propertyId: string): Promise<string[]> => {
//   const uploadPromises = images.map(async (imageUri, index) => {
//     const response = await fetch(imageUri);
//     const blob = await response.blob();
//     const imageRef = ref(storage, `properties/${propertyId}/image_${index}`);
//     await uploadBytes(imageRef, blob);
//     return await getDownloadURL(imageRef);
//   });
//   return Promise.all(uploadPromises);
// };

// FIREBASE INTEGRATION POINT 6: Delete property images helper function
// const deletePropertyImages = async (imageUrls: string[]): Promise<void> => {
//   const deletePromises = imageUrls.map(async (url) => {
//     try {
//       const imageRef = ref(storage, url);
//       await deleteObject(imageRef);
//     } catch (error) {
//       console.warn('Failed to delete image:', url, error);
//     }
//   });
//   await Promise.all(deletePromises);
// };

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      favoriteIds: [],
      recentlyViewed: [],
      filter: {},
      isLoading: false,
      error: null,

      toggleFavorite: (id: string) => {
        set((state) => {
          const isFavorite = state.favoriteIds.includes(id);
          return {
            favoriteIds: isFavorite
              ? state.favoriteIds.filter((favId) => favId !== id)
              : [...state.favoriteIds, id],
          };
        });
      },

      addToRecentlyViewed: (id: string) => {
        set((state) => {
          const filtered = state.recentlyViewed.filter((viewedId) => viewedId !== id);
          return {
            recentlyViewed: [id, ...filtered].slice(0, 10),
          };
        });
      },

      updateFilter: (filter: Partial<PropertyFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      resetFilter: () => {
        set({ filter: {} });
      },

      getFilteredProperties: () => {
        const { properties, filter } = get();
        
        return properties.filter((property) => {
          // Price filter
          if (filter.priceMin && property.price < filter.priceMin) return false;
          if (filter.priceMax && property.price > filter.priceMax) return false;
          
          // Beds filter
          if (filter.bedsMin && property.beds < filter.bedsMin) return false;
          
          // Baths filter
          if (filter.bathsMin && property.baths < filter.bathsMin) return false;
          
          // Property type filter
          if (filter.type && filter.type.length > 0 && !filter.type.includes(property.type)) return false;
          
          // Status filter
          if (filter.status && filter.status.length > 0 && !filter.status.includes(property.status as any)) return false;
          
          // 3D Tour filter
          if (filter.has3DTour && !property.has3DTour) return false;
          
          // 3D Model filter
          if (filter.has3DModel && !property.has3DModel) return false;
          
          return true;
        });
      },

      isFavorite: (id: string) => {
        return get().favoriteIds.includes(id);
      },

      clearError: () => {
        set({ error: null });
      },
      
      fetchProperties: async (forceRefresh = false) => {
        set({ isLoading: true, error: null });
        
        try {
          // FIREBASE INTEGRATION POINT 7: Replace with Firestore query
          // const propertiesRef = collection(db, 'properties');
          // const q = query(propertiesRef, orderBy('createdAt', 'desc'));
          // const querySnapshot = await getDocs(q);
          // 
          // const properties: Property[] = [];
          // querySnapshot.forEach((doc) => {
          //   const data = doc.data();
          //   properties.push({
          //     id: doc.id,
          //     ...data,
          //     createdAt: data.createdAt?.toDate() || new Date(),
          //     updatedAt: data.updatedAt?.toDate() || new Date(),
          //   } as Property);
          // });
          // 
          // set({ 
          //   properties,
          //   isLoading: false 
          // });
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Sort by creation date, newest first
          const sortedProperties = [...mockProperties].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          
          set({ 
            properties: sortedProperties,
            isLoading: false 
          });
          
        } catch (error: any) {
          console.error('Error fetching properties:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch properties' 
          });
        }
      },
      
      fetchSellerProperties: async (sellerId: string) => {
        set({ isLoading: true, error: null });
        try {
          // FIREBASE INTEGRATION POINT 8: Replace with Firestore query for seller properties
          // const propertiesRef = collection(db, 'properties');
          // const q = query(
          //   propertiesRef, 
          //   where('sellerId', '==', sellerId),
          //   orderBy('createdAt', 'desc')
          // );
          // const querySnapshot = await getDocs(q);
          // 
          // const sellerProperties: Property[] = [];
          // querySnapshot.forEach((doc) => {
          //   const data = doc.data();
          //   sellerProperties.push({
          //     id: doc.id,
          //     ...data,
          //     createdAt: data.createdAt?.toDate() || new Date(),
          //     updatedAt: data.updatedAt?.toDate() || new Date(),
          //   } as Property);
          // });
          // 
          // set({ isLoading: false });
          // return sellerProperties;
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const sellerProperties = mockProperties
            .filter(property => property.sellerId === sellerId)
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
          
          set({ isLoading: false });
          return sellerProperties;
        } catch (error: any) {
          console.error('Error fetching seller properties:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch seller properties' 
          });
          return [];
        }
      },
      
      addProperty: async (property: Omit<Property, 'id'>, images: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
          // FIREBASE INTEGRATION POINT 9: Replace with Firestore add and Firebase Storage upload
          // // First, add the property to get an ID
          // const propertiesRef = collection(db, 'properties');
          // const docRef = await addDoc(propertiesRef, {
          //   ...property,
          //   createdAt: Timestamp.now(),
          //   updatedAt: Timestamp.now(),
          //   images: [], // Will be updated after image upload
          // });
          // 
          // // Upload images to Firebase Storage
          // const uploadedImageUrls = await uploadPropertyImages(images, docRef.id);
          // 
          // // Update the property with image URLs
          // await updateDoc(docRef, {
          //   images: uploadedImageUrls
          // });
          // 
          // const newProperty: Property = {
          //   id: docRef.id,
          //   ...property,
          //   images: uploadedImageUrls,
          //   createdAt: new Date(),
          //   updatedAt: new Date(),
          // };
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const newProperty: Property = {
            id: generatePropertyId(),
            ...property,
            images: images,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Add to mock database
          mockProperties.push(newProperty);
          
          set((state) => ({ 
            properties: [...state.properties, newProperty],
            isLoading: false 
          }));
          
          return newProperty;
        } catch (error: any) {
          console.error('Error adding property:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to add property' 
          });
          throw error;
        }
      },
      
      updateProperty: async (id: string, property: Partial<Property>, newImages?: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
          // FIREBASE INTEGRATION POINT 10: Replace with Firestore update and Firebase Storage
          // const propertyRef = doc(db, 'properties', id);
          // const propertyDoc = await getDoc(propertyRef);
          // 
          // if (!propertyDoc.exists()) {
          //   throw new Error('Property not found');
          // }
          // 
          // const currentData = propertyDoc.data() as Property;
          // let imageUrls = currentData.images;
          // 
          // // If new images are provided, upload them and delete old ones
          // if (newImages && newImages.length > 0) {
          //   // Delete old images
          //   await deletePropertyImages(currentData.images);
          //   
          //   // Upload new images
          //   imageUrls = await uploadPropertyImages(newImages, id);
          // }
          // 
          // const updateData = {
          //   ...property,
          //   images: imageUrls,
          //   updatedAt: Timestamp.now(),
          // };
          // 
          // await updateDoc(propertyRef, updateData);
          // 
          // const updatedProperty = {
          //   ...currentData,
          //   ...updateData,
          //   updatedAt: new Date(),
          // };
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find and update property in mock database
          const propertyIndex = mockProperties.findIndex(p => p.id === id);
          if (propertyIndex === -1) {
            throw new Error('Property not found');
          }
          
          const updatedProperty = {
            ...mockProperties[propertyIndex],
            ...property,
            images: newImages || mockProperties[propertyIndex].images,
            updatedAt: new Date(),
          };
          
          mockProperties[propertyIndex] = updatedProperty;
          
          set((state) => ({ 
            properties: state.properties.map(p => 
              p.id === id ? updatedProperty : p
            ),
            isLoading: false 
          }));
          
          return updatedProperty;
        } catch (error: any) {
          console.error('Error updating property:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update property' 
          });
          throw error;
        }
      },
      
      deleteProperty: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // FIREBASE INTEGRATION POINT 11: Replace with Firestore delete and Firebase Storage cleanup
          // const propertyRef = doc(db, 'properties', id);
          // const propertyDoc = await getDoc(propertyRef);
          // 
          // if (propertyDoc.exists()) {
          //   const propertyData = propertyDoc.data() as Property;
          //   
          //   // Delete property images from Firebase Storage
          //   await deletePropertyImages(propertyData.images);
          //   
          //   // Delete property document from Firestore
          //   await deleteDoc(propertyRef);
          // }
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Remove from mock database
          mockProperties = mockProperties.filter(p => p.id !== id);
          
          set((state) => ({ 
            properties: state.properties.filter(p => p.id !== id),
            favoriteIds: state.favoriteIds.filter(favId => favId !== id),
            recentlyViewed: state.recentlyViewed.filter(viewedId => viewedId !== id),
            isLoading: false 
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error deleting property:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete property' 
          });
          return false;
        }
      },

      getPropertyById: async (id: string) => {
        try {
          // FIREBASE INTEGRATION POINT 12: Replace with Firestore get document
          // const propertyRef = doc(db, 'properties', id);
          // const propertyDoc = await getDoc(propertyRef);
          // 
          // if (propertyDoc.exists()) {
          //   const data = propertyDoc.data();
          //   return {
          //     id: propertyDoc.id,
          //     ...data,
          //     createdAt: data.createdAt?.toDate() || new Date(),
          //     updatedAt: data.updatedAt?.toDate() || new Date(),
          //   } as Property;
          // }
          // return null;
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const property = mockProperties.find(p => p.id === id);
          return property || null;
        } catch (error: any) {
          console.error('Error getting property by ID:', error);
          return null;
        }
      },
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        recentlyViewed: state.recentlyViewed,
        filter: state.filter,
      }),
    }
  )
);

// FIREBASE INTEGRATION POINT 13: Real-time property listener setup
// This would typically be called in your app to listen for real-time updates
// export const initializePropertyListener = () => {
//   const { properties } = usePropertyStore.getState();
//   
//   const propertiesRef = collection(db, 'properties');
//   const q = query(propertiesRef, orderBy('createdAt', 'desc'));
//   
//   return onSnapshot(q, (querySnapshot) => {
//     const updatedProperties: Property[] = [];
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       updatedProperties.push({
//         id: doc.id,
//         ...data,
//         createdAt: data.createdAt?.toDate() || new Date(),
//         updatedAt: data.updatedAt?.toDate() || new Date(),
//       } as Property);
//     });
//     
//     usePropertyStore.setState({ properties: updatedProperties });
//   });
// };

// FIREBASE INTEGRATION POINT 14: Favorites sync with Firestore
// You might want to sync favorites with user's Firestore document
// export const syncFavoritesWithFirestore = async (userId: string, favoriteIds: string[]) => {
//   try {
//     const userRef = doc(db, 'users', userId);
//     await updateDoc(userRef, {
//       favoriteProperties: favoriteIds
//     });
//   } catch (error) {
//     console.error('Error syncing favorites:', error);
//   }
// };