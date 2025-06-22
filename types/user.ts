export type UserRole = 'buyer' | 'seller' | 'both';

export interface User {
  id: string;
  name: string;
  email: string;
  isSeller: boolean;
  sellerModeActive: boolean;
  createdAt: string; // Or a Date object if you prefer
  // Add any other properties you store in Firestore
}