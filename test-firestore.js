import { Firestore } from '@google-cloud/firestore';

const db = new Firestore({
  projectId: 'ais-asia-east1-6f1f14a5394847f',
  databaseId: 'ai-studio-educationalstudy-e622a72c-26f7-4f20-9cbf-56c7d5961e47'
});

db.collection('users').get().then(snap => {
  console.log("Size:", snap.size);
}).catch(console.error);
