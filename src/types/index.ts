export type GrowStage = 'Germination' | 'Seedling' | 'Vegetative' | 'Flower' | 'Harvested';

export interface Grow {
  id: string;
  ownerId: string;
  name: string;
  stage: GrowStage;
  medium: string;
  startDate: any; // Firestore Timestamp
  archived: boolean;
  createdAt: any;
  updatedAt: any;
  lightType?: string;
}

export interface Plant {
  id: string;
  growId: string;
  ownerId: string;
  name: string;
  strain: string;
  archived: boolean;
  createdAt: any;
  updatedAt: any;
  batchLabel?: string;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  timezone?: string;
  createdAt: any;
  lastLogin: any;
}

export type MediaType = 'image' | 'video';
export type UploadStatus = 'uploading' | 'uploaded' | 'failed' | 'archived';

export interface MediaAsset {
  id: string;
  ownerId: string;
  growId: string;
  plantId: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  mediaType: MediaType;
  uploadStatus: UploadStatus;
  createdAt: any;
  updatedAt: any;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
