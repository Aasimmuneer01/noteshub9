import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkResource() {
  const q = query(collection(db, 'resources'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log('Resource data:', snap.docs[0].data());
  } else {
    console.log('No resources found');
  }
}

checkResource();
