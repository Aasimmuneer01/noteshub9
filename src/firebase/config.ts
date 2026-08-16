import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAjpGS1Oj6yhHv3wv4F2tET69N_Qe9DMh0",
  authDomain: "resourceswebsite-4871a.firebaseapp.com",
  projectId: "resourceswebsite-4871a",
  storageBucket: "resourceswebsite-4871a.firebasestorage.app",
  messagingSenderId: "499105267177",
  appId: "1:499105267177:web:d88137205e617e294c1f78"
};

// Log configuration (excluding full API key)
console.log('Firebase Configuration:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + '...' : 'N/A'
});

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);

export const storage = getStorage(app);

storage.maxUploadRetryTime = 10000;
storage.maxOperationRetryTime = 10000;
