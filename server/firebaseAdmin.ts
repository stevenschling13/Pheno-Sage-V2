import admin from 'firebase-admin';
import type { ServerEnv } from './env';

let app: admin.app.App | null = null;

export function initFirebaseAdmin(env: ServerEnv): admin.app.App {
  if (app) return app;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
    });
  } else {
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID,
    });
  }

  return app;
}

export function getAdminAuth(): admin.auth.Auth {
  if (!app) throw new Error('Firebase Admin not initialized');
  return app.auth();
}
