export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';
export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold' | 'pending';
export type DeviceCapability = 'low' | 'medium' | 'high';

export interface PropertyFilter {
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  type?: PropertyType[];
  status?: PropertyStatus[];
  has3DTour?: boolean;
  has3DModel?: boolean;
}

export interface TourRoom {
  id: string;
  name: string;
  panoramaImage: string;
  connections: string[]; // IDs of connected rooms
  description?: string;
  isMain?: boolean; // Whether this is the main/entrance room
  features?: string[]; // Special features of this room
  
  // Enhanced properties for optimization
  optimizedForLowEnd?: boolean;
  imageQuality?: 'low' | 'medium' | 'high';
  enableVRMode?: boolean;
  supportedDevices?: DeviceCapability[];
}

export type HotspotType = 'info' | 'room' | 'feature';

export interface Hotspot {
  id: string;
  type: HotspotType;
  title: string;
  description: string;
  position: { x: number; y: number; z: number };
  linkedRoomId?: string; // For room hotspots, links to a room in the tour
}

export interface Model3D {
  id: string;
  name: string;
  modelUrl: string;
  thumbnailUrl: string;
  format: '3d-model/gltf' | '3d-model/glb' | '3d-model/obj' | '3d-model/usdz';
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  textureInfo?: string; // Information about textures
  textureFiles?: string[]; // URLs to texture files if separate
  hasEmbeddedTextures?: boolean; // Whether textures are embedded in the GLB
  description?: string; // Detailed description of the model
  hotspots?: Hotspot[]; // Interactive hotspots in the model
  
  // Enhanced properties for optimization
  optimizedForLowEnd?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
  supportedDevices?: DeviceCapability[];
  estimatedFileSize?: string;
  renderingHints?: {
    maxPolygons?: number;
    textureResolution?: number;
    enableShadows?: boolean;
    enableReflections?: boolean;
  };
}

export interface Property {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  price: number;
  beds: number;
  baths: number;
  sqm: number; // Square metres
  lotSize?: number;
  yearBuilt?: number;
  type: PropertyType;
  status: PropertyStatus;
  features: string[];
  images: string[];
  
  // Enhanced image support
  imageVersions?: Array<{
    thumbnail: string;
    medium: string;
    full: string;
  }>;
  
  // 3D Tour support
  has3DTour: boolean;
  tourUrl?: string;
  tourRooms?: TourRoom[];
  tourSettings?: {
    enableVRMode?: boolean;
    optimizeForLowEnd?: boolean;
    imageQuality?: 'low' | 'medium' | 'high';
    supportOfflineViewing?: boolean;
  };
  
  // 3D Model support
  has3DModel?: boolean;
  models3D?: Model3D[];
  
  // Location
  latitude?: number;
  longitude?: number;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  listedDate?: string;
  
  // Offline and performance optimization
  isOfflineReady?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
  supportedDevices?: DeviceCapability[];
  estimatedDataUsage?: string;
}