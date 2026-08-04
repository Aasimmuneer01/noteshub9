import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser() {
  const uid = 'H1FO66X1uqePVc93korm8kLxbUE2'; // From user request
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    console.log('User data:', snap.data());
  } else {
    console.log('User not found');
  }
}

checkUser();
