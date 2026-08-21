const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = JSON.parse(require('fs').readFileSync('firebase-applet-config.json', 'utf8'));

try {
    initializeApp();
    const db = getFirestore(config.firestoreDatabaseId);
    console.log("DB initialized successfully for:", config.firestoreDatabaseId);
} catch (e) {
    console.error("Failed:", e);
}
