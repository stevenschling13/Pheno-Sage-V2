import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { clientEnv } from './env';

const app = initializeApp({
  apiKey: clientEnv.VITE_FIREBASE_API_KEY,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app, clientEnv.VITE_FIREBASE_DATABASE_ID ?? '(default)');
export const storage = getStorage(app);

export default app;
