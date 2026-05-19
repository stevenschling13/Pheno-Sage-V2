import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getBlob } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  MediaAsset,
  MediaType,
  UploadStatus,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '../types';

export class MediaServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaServiceError';
  }
}

const requireFirebase = () => {
  if (!db || !storage) throw new MediaServiceError('Firebase is not initialized.');
  return { db, storage };
};

export const validateMediaFile = (
  file: File,
): { valid: boolean; error?: string; type?: MediaType } => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { valid: false, error: 'Image exceeds 20MB limit' };
    }
    return { valid: true, type: 'image' };
  }

  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return { valid: false, error: 'Video exceeds 200MB limit' };
    }
    return { valid: true, type: 'video' };
  }

  return { valid: false, error: 'Unsupported file type' };
};

export const uploadPlantMedia = async (
  userId: string,
  growId: string,
  plantId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<MediaAsset> => {
  const f = requireFirebase();
  const validation = validateMediaFile(file);
  if (!validation.valid || !validation.type) {
    throw new MediaServiceError(validation.error || 'Invalid file');
  }

  const mediaType = validation.type;

  // Create a new document reference to get an ID
  const newAssetRef = doc(collection(f.db, 'media_assets'));
  const mediaId = newAssetRef.id;

  const storagePath = `users/${userId}/grows/${growId}/plants/${plantId}/media/${mediaId}`;

  const initialAssetFirestore = {
    ownerId: userId,
    growId,
    plantId,
    storagePath,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    mediaType,
    uploadStatus: 'uploading' as UploadStatus,
  };

  // Pre-create the draft in Firestore
  await setDoc(newAssetRef, {
    ...initialAssetFirestore,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const storageRef = ref(f.storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        // Handle failed upload
        updateDoc(newAssetRef, {
          uploadStatus: 'failed',
          updatedAt: serverTimestamp(),
        }).catch(console.error); // Best effort

        reject(new MediaServiceError('Upload failed: ' + error.message));
      },
      async () => {
        // Upload successful
        await updateDoc(newAssetRef, {
          uploadStatus: 'uploaded',
          updatedAt: serverTimestamp(),
        });

        // Return latest locally known state; actual state comes from snapshot usually.
        resolve({
          id: mediaId,
          ...initialAssetFirestore,
          uploadStatus: 'uploaded',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
    );
  });
};

export const subscribePlantMedia = (
  userId: string,
  plantId: string,
  onUpdate: (assets: MediaAsset[]) => void,
): Unsubscribe => {
  const f = requireFirebase();
  const q = query(
    collection(f.db, 'media_assets'),
    where('ownerId', '==', userId),
    where('plantId', '==', plantId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const assets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MediaAsset[];

      // Filter out logically deleted/archived
      onUpdate(assets.filter((a) => a.uploadStatus !== 'archived'));
    },
    (error) => {
      console.error('Error fetching media assets:', error);
    },
  );
};

export const archiveMediaAsset = async (assetId: string): Promise<void> => {
  const f = requireFirebase();
  const assetRef = doc(f.db, 'media_assets', assetId);
  await updateDoc(assetRef, {
    uploadStatus: 'archived',
    updatedAt: serverTimestamp(),
  });
};

export const getMediaBlob = async (storagePath: string): Promise<Blob> => {
  const f = requireFirebase();
  const fileRef = ref(f.storage, storagePath);
  try {
    return await getBlob(fileRef);
  } catch (error: any) {
    throw new MediaServiceError(
      `Failed to retrieve media from storage. Please check your connection. Details: ${error.message}`,
    );
  }
};

export const getMediaBlobUrl = async (storagePath: string): Promise<string> => {
  const blob = await getMediaBlob(storagePath);
  return URL.createObjectURL(blob);
};
