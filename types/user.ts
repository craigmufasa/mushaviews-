export type UserRole = 'buyer' | 'seller' | 'both';

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  isSeller: boolean;
  sellerModeActive?: boolean;
  createdAt: string;
  role?: UserRole;
}