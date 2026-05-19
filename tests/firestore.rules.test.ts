import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 58080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  describe('Unauthenticated access', () => {
    it('denies read/write to users, grows, tools without auth', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(getDoc(doc(unauthedDb, 'users', 'user1')));
      await assertFails(setDoc(doc(unauthedDb, 'users', 'user1'), { uid: 'user1' }));

      await assertFails(getDoc(doc(unauthedDb, 'grows', 'grow1')));
      await assertFails(setDoc(doc(unauthedDb, 'grows', 'grow1'), { ownerId: 'user1' }));

      await assertFails(getDoc(doc(unauthedDb, 'plants', 'plant1')));
      await assertFails(setDoc(doc(unauthedDb, 'plants', 'plant1'), { ownerId: 'user1' }));
    });
  });

  describe('User profiles', () => {
    it('allows user to read/write their own profile', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'users', 'alice'), {
          uid: 'alice',
          email: 'alice@example.com',
          displayName: 'Alice',
          photoURL: null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          timezone: 'UTC',
        }),
      );
      await assertSucceeds(getDoc(doc(db, 'users', 'alice')));
    });

    it('denies user A reading/writing user B profile', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(getDoc(doc(db, 'users', 'bob')));
      await assertFails(
        setDoc(doc(db, 'users', 'bob'), {
          uid: 'bob',
          email: 'bob@example.com',
          displayName: 'Bob',
          photoURL: null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          timezone: 'UTC',
        }),
      );
    });
  });

  describe('Grows', () => {
    it('allows user to create a valid grow', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'grows', 'grow1'), {
          ownerId: 'alice',
          name: 'My Grow',
          stage: 'Vegetative',
          medium: 'Soil',
          startDate: serverTimestamp(),
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('denies user A reading/writing user Bs grow', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();

      // Setup bob's grow directly bypassing rules to test read access
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'grows', 'growB'), { ownerId: 'bob' });
      });

      await assertFails(getDoc(doc(aliceDb, 'grows', 'growB')));
      await assertFails(setDoc(doc(aliceDb, 'grows', 'growB'), { ownerId: 'alice' }));
    });

    it('rejects grow create with extra fields', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'grows', 'grow1'), {
          ownerId: 'alice',
          name: 'My Grow',
          stage: 'Vegetative',
          medium: 'Soil',
          startDate: serverTimestamp(),
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          extraField: 'not allowed',
        }),
      );
    });

    it('rejects grow update ownerId mutation', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const growRef = doc(db, 'grows', 'grow1');
      await assertSucceeds(
        setDoc(growRef, {
          ownerId: 'alice',
          name: 'My Grow',
          stage: 'Vegetative',
          medium: 'Soil',
          startDate: serverTimestamp(),
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(growRef, {
          ownerId: 'bob',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('rejects grow update createdAt mutation', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const growRef = doc(db, 'grows', 'grow1');
      await assertSucceeds(
        setDoc(growRef, {
          ownerId: 'alice',
          name: 'My Grow',
          stage: 'Vegetative',
          medium: 'Soil',
          startDate: serverTimestamp(),
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(growRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('rejects grow update with extra fields', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const growRef = doc(db, 'grows', 'grow1');
      await assertSucceeds(
        setDoc(growRef, {
          ownerId: 'alice',
          name: 'My Grow',
          stage: 'Vegetative',
          medium: 'Soil',
          startDate: serverTimestamp(),
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(growRef, {
          extraField: 'not allowed',
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('Plants', () => {
    beforeEach(async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await setDoc(doc(db, 'grows', 'aliceGrow'), {
        ownerId: 'alice',
        name: 'My Grow',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: serverTimestamp(),
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const bobDb = testEnv.authenticatedContext('bob').firestore();
      await setDoc(doc(bobDb, 'grows', 'bobGrow'), {
        ownerId: 'bob',
        name: 'Bob Grow',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: serverTimestamp(),
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    it('allows user to create a valid plant under their own grow', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'plants', 'plant1'), {
          ownerId: 'alice',
          growId: 'aliceGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('denies user A reading/writing user Bs plant', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'plants', 'plantB'), { ownerId: 'bob', growId: 'bobGrow' });
      });

      await assertFails(getDoc(doc(aliceDb, 'plants', 'plantB')));
    });

    it('rejects plant create pointing to another users grow', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'plants', 'plant1'), {
          ownerId: 'alice',
          growId: 'bobGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('rejects plant create with extra fields', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'plants', 'plant1'), {
          ownerId: 'alice',
          growId: 'aliceGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          extraField: true,
        }),
      );
    });

    it('rejects plant update ownerId mutation', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const plantRef = doc(db, 'plants', 'plant1');
      await assertSucceeds(
        setDoc(plantRef, {
          ownerId: 'alice',
          growId: 'aliceGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(plantRef, {
          ownerId: 'bob',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('rejects plant update growId mutation', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const plantRef = doc(db, 'plants', 'plant1');
      await assertSucceeds(
        setDoc(plantRef, {
          ownerId: 'alice',
          growId: 'aliceGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(plantRef, {
          growId: 'someOtherGrow',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('rejects plant update createdAt mutation', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const plantRef = doc(db, 'plants', 'plant1');
      await assertSucceeds(
        setDoc(plantRef, {
          ownerId: 'alice',
          growId: 'aliceGrow',
          name: 'Plant 1',
          strain: 'OG Kush',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );

      await assertFails(
        updateDoc(plantRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('Media Assets', () => {
    beforeEach(async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await setDoc(doc(db, 'grows', 'aliceGrow'), {
        ownerId: 'alice',
        name: 'My Grow',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: serverTimestamp(),
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'plants', 'alicePlant'), {
        ownerId: 'alice',
        growId: 'aliceGrow',
        name: 'Plant 1',
        strain: 'OG Kush',
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const bobDb = testEnv.authenticatedContext('bob').firestore();
      await setDoc(doc(bobDb, 'grows', 'bobGrow'), {
        ownerId: 'bob',
        name: 'Bob Grow',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: serverTimestamp(),
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(bobDb, 'plants', 'bobPlant'), {
        ownerId: 'bob',
        growId: 'bobGrow',
        name: 'Plant 2',
        strain: 'OG Kush',
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const validMediaAsset = {
      ownerId: 'alice',
      growId: 'aliceGrow',
      plantId: 'alicePlant',
      storagePath: 'users/alice/grows/aliceGrow/plants/alicePlant/media/media1',
      fileName: 'test.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      mediaType: 'image',
      uploadStatus: 'uploading',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    it('allows valid create for owner with matching grow and plant', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(setDoc(doc(db, 'media_assets', 'media1'), validMediaAsset));
    });

    it('denies create with extra ID field', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'media_assets', 'media1'), { ...validMediaAsset, id: 'media1' }),
      );
    });

    it('denies create if owner is wrong', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'media_assets', 'media1'), {
          ...validMediaAsset,
          ownerId: 'bob',
          storagePath: 'users/bob/grows/aliceGrow/plants/alicePlant/media/media1',
        }),
      );
    });

    it('denies create if grow belongs to someone else', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'media_assets', 'media1'), {
          ...validMediaAsset,
          growId: 'bobGrow',
          storagePath: 'users/alice/grows/bobGrow/plants/alicePlant/media/media1',
        }),
      );
    });

    it('denies create if plant belongs to someone else', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(
        setDoc(doc(db, 'media_assets', 'media1'), {
          ...validMediaAsset,
          plantId: 'bobPlant',
          storagePath: 'users/alice/grows/aliceGrow/plants/bobPlant/media/media1',
        }),
      );
    });

    it('denies create if storage path ID mismatches document ID', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      await assertFails(setDoc(doc(db, 'media_assets', 'media2'), validMediaAsset));
    });

    it('allows update when only uploadStatus and updatedAt change', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const mediaRef = doc(db, 'media_assets', 'media1');
      await assertSucceeds(setDoc(mediaRef, validMediaAsset));
      await assertSucceeds(
        updateDoc(mediaRef, { uploadStatus: 'uploaded', updatedAt: serverTimestamp() }),
      );
    });

    it('denies update mutating protected fields like ownerId', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();
      const mediaRef = doc(db, 'media_assets', 'media1');
      await assertSucceeds(setDoc(mediaRef, validMediaAsset));
      await assertFails(updateDoc(mediaRef, { ownerId: 'bob', updatedAt: serverTimestamp() }));
    });
  });

  describe('Future Controlled Collections', () => {
    it('denies client writes to analysis, findings, notifications, prompts, chat', async () => {
      const db = testEnv.authenticatedContext('alice').firestore();

      const collections = [
        'analysis_jobs',
        'plant_analyses',
        'plant_findings',
        'notifications',
        'prompt_versions',
        'chat_threads',
      ];

      for (const col of collections) {
        await assertFails(setDoc(doc(db, col, 'doc1'), { ownerId: 'alice' }));
      }

      // Test chat_messages subcollection
      await assertFails(
        setDoc(doc(db, 'chat_threads/thread1/messages', 'msg1'), { ownerId: 'alice' }),
      );
    });
  });
});
