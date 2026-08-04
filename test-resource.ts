import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAjpGS1Oj6yhHv3wv4F2tET69N_Qe9DMh0",
  authDomain: "resourceswebsite-4871a.firebaseapp.com",
  projectId: "resourceswebsite-4871a",
  storageBucket: "resourceswebsite-4871a.firebasestorage.app",
  messagingSenderId: "499105267177",
  appId: "1:499105267177:web:d88137205e617e294c1f78"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkResource() {
  const q = query(collection(db, 'resources'), limit(5));
  const snap = await getDocs(q);
  if (!snap.empty) {
    snap.docs.forEach(d => console.log('Resource data:', d.data()));
  } else {
    console.log('No resources found');
  }
}

checkResource();
