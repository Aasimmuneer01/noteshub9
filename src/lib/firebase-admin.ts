import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import rawConfig from '../../firebase-applet-config.json';

const adminApp = getApps().length === 0 
  ? initializeApp({
      projectId: "ai-studio-educationalstudy-e622a72c-26f7-4f20-9cbf-56c7d5961e47"
    }) 
  : getApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
