import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: any;

function getDb() {
    if (!db) {
        try {
            if (getApps().length === 0) {
                initializeApp(); // Let Firebase detect environment configuration automatically
            }
            db = getFirestore();
        } catch (e) {
            console.error('Firebase Admin init failed', e);
            db = null; // Mark as failed
        }
    }
    return db;
}

export async function updateAnalytics(type: 'received' | 'replied' | 'failed') {
    const db = getDb();
    if (!db) {
        console.warn('Analytics skipped: Database not available');
        return;
    }
    try {
        const docRef = db.collection('analytics').doc('summary');
        const now = new Date().toISOString();
        await db.runTransaction(async (transaction: any) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                transaction.set(docRef, {
                    totalEmailsReceived: type === 'received' ? 1 : 0,
                    totalAIRepliesSent: type === 'replied' ? 1 : 0,
                    failedReplies: type === 'failed' ? 1 : 0,
                    lastReceivedEmail: type === 'received' ? now : null,
                    lastAIReplyTime: type === 'replied' ? now : null
                });
            } else {
                const data = doc.data()!;
                const update: any = {
                    totalEmailsReceived: (data.totalEmailsReceived || 0) + (type === 'received' ? 1 : 0),
                    totalAIRepliesSent: (data.totalAIRepliesSent || 0) + (type === 'replied' ? 1 : 0),
                    failedReplies: (data.failedReplies || 0) + (type === 'failed' ? 1 : 0)
                };
                if (type === 'received') update.lastReceivedEmail = now;
                if (type === 'replied') update.lastAIReplyTime = now;
                transaction.update(docRef, update);
            }
        });
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

export async function logEmail(emailId: string, status: 'success' | 'failed' | 'pending', error?: string) {
    const db = getDb();
    if (!db) return;
    try {
        await db.collection('emailLogs').add({
            emailId,
            status,
            timestamp: new Date().toISOString(),
            error: error || null
        });
    } catch (error) {
        console.error('Error logging email:', error);
    }
}

export async function logPendingReview(emailId: string, reason: string) {
    const db = getDb();
    if (!db) return;
    try {
        await db.collection('pendingReviews').add({
            emailId,
            reason,
            status: 'Needs Human Review',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error logging pending review:', error);
    }
}
