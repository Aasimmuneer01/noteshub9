const fs = require('fs');
const path = require('path');

const index = path.join(__dirname, 'api', 'index.ts');
let content = fs.readFileSync(index, 'utf8');
content = content.replace(/import \{ getFirestore \} from 'firebase-admin\/firestore';\n/, '');
fs.writeFileSync(index, content);

const analytics = path.join(__dirname, 'api', '_analytics.ts');
fs.writeFileSync(analytics, `
export async function updateAnalytics(type: 'received' | 'replied' | 'failed') {
    // Disabled in this environment due to service account missing Firestore API
}
export async function logEmail(emailId: string, status: 'success' | 'failed' | 'pending', error?: string) {
    // Disabled
}
export async function logPendingReview(emailId: string, reason: string) {
    // Disabled
}
`);

console.log("Cleaned up firebase-admin");
