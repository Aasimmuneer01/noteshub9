import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAjpGS1Oj6yhHv3wv4F2tET69N_Qe9DMh0",
  authDomain: "resourceswebsite-4871a.firebaseapp.com",
  projectId: "resourceswebsite-4871a",
  storageBucket: "resourceswebsite-4871a.firebasestorage.app",
  messagingSenderId: "499105267177",
  appId: "1:499105267177:web:d88137205e617e294c1f78"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use initializeFirestore to force long polling for stability in AI Studio and certain proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false, 
});

export const storage = getStorage(app);

/*
try {
  enableIndexedDbPersistence(db);
} catch (err: any) {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Persistence failed: Not supported in this browser.');
  }
}
*/

storage.maxUploadRetryTime = 10000;
storage.maxOperationRetryTime = 10000;
