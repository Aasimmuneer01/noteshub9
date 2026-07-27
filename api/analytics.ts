import * as admin from 'firebase-admin';

const db = admin.firestore();
const ANALYTICS_REF = db.collection('analytics').doc('summary');

export async function updateAnalytics(type: 'received' | 'replied' | 'failed') {
    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ANALYTICS_REF);
            const data = doc.data() || {
                totalEmailsReceived: 0,
                totalAIRepliesSent: 0,
                failedReplies: 0,
            };

            const update: any = {};
            if (type === 'received') update.totalEmailsReceived = (data.totalEmailsReceived || 0) + 1;
            if (type === 'replied') update.totalAIRepliesSent = (data.totalAIRepliesSent || 0) + 1;
            if (type === 'failed') update.failedReplies = (data.failedReplies || 0) + 1;
            
            update.lastReplyTime = new Date().toISOString();

            transaction.set(ANALYTICS_REF, { ...data, ...update }, { merge: true });
        });
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

export async function logEmail(emailId: string, status: 'success' | 'failed' | 'pending', error?: string) {
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
