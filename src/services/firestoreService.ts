import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp, 
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Grow, Plant, GrowStage } from '../types';

/**
 * Grow Services
 */

export const createGrow = async (ownerId: string, data: { name: string, stage: GrowStage, medium: string, startDate: Date }) => {
  if (!db) throw new Error('Firestore not initialized');
  const growsRef = collection(db, 'grows');
  return await addDoc(growsRef, {
    ...data,
    ownerId,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getGrows = async (ownerId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const growsRef = collection(db, 'grows');
  const q = query(
    growsRef, 
    where('ownerId', '==', ownerId), 
    where('archived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grow));
};

export const getGrowById = async (growId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'grows', growId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Grow;
  }
  return null;
};

export const updateGrow = async (growId: string, data: Partial<Grow>) => {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'grows', growId);
  // Remove fields that should not be updated directly via partial update
  const { id, ownerId, createdAt, ...updateData } = data as any;
  return await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Plant Services
 */

export const createPlant = async (ownerId: string, growId: string, data: { name: string, strain: string }) => {
  if (!db) throw new Error('Firestore not initialized');
  const plantsRef = collection(db, 'plants');
  return await addDoc(plantsRef, {
    ...data,
    ownerId,
    growId,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getPlantsByGrow = async (ownerId: string, growId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const plantsRef = collection(db, 'plants');
  const q = query(
    plantsRef, 
    where('ownerId', '==', ownerId), 
    where('growId', '==', growId),
    where('archived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plant));
};

export const getAllPlants = async (ownerId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const plantsRef = collection(db, 'plants');
  const q = query(
    plantsRef, 
    where('ownerId', '==', ownerId), 
    where('archived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plant));
};

export const getPlantById = async (plantId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'plants', plantId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Plant;
  }
  return null;
};

export const getPlantMedia = async (plantId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const q = query(
    collection(db, 'media_assets'),
    where('plantId', '==', plantId),
    where('uploadStatus', '==', 'uploaded'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const updatePlant = async (plantId: string, data: Partial<Plant>) => {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'plants', plantId);
  // Remove fields that should not be updated directly
  const { id, ownerId, growId, createdAt, ...updateData } = data as any;
  return await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};
