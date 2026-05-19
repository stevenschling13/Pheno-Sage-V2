import type { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Fields backed by Firestore timestamps can appear as:
 *   - Timestamp when reading from a snapshot
 *   - FieldValue (e.g. serverTimestamp()) when writing
 *   - Date as a transient local placeholder before a snapshot lands
 * Use {@link toJsDate} to safely render one.
 */
export type FirestoreTimestamp = Timestamp | FieldValue | Date;

export function toJsDate(value: FirestoreTimestamp | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === 'function') return (value as Timestamp).toDate();
  const seconds = (value as { seconds?: number }).seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000);
  return null;
}

export type GrowStage = 'Germination' | 'Seedling' | 'Vegetative' | 'Flower' | 'Harvested';

export interface Grow {
  id: string;
  ownerId: string;
  name: string;
  stage: GrowStage;
  medium: string;
  startDate: FirestoreTimestamp;
  archived: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  lightType?: string;
}

export interface Plant {
  id: string;
  growId: string;
  ownerId: string;
  name: string;
  strain: string;
  archived: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  batchLabel?: string;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  timezone?: string;
  createdAt: FirestoreTimestamp;
  lastLogin: FirestoreTimestamp;
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
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
