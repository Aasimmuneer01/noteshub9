const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = JSON.parse(require('fs').readFileSync('firebase-applet-config.json', 'utf8'));

async function run() {
    try {
        initializeApp();
        const db = getFirestore(config.firestoreDatabaseId);
        console.log("DB initialized successfully for:", config.firestoreDatabaseId);
        const snap = await db.collection('ai_assistants').limit(1).get();
        console.log("Query successful, docs count:", snap.size);
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
