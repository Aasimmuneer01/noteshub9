
export async function updateAnalytics(type: 'received' | 'replied' | 'failed') {
    // Disabled in this environment due to service account missing Firestore API
}
export async function logEmail(emailId: string, status: 'success' | 'failed' | 'pending', error?: string) {
    // Disabled
}
export async function logPendingReview(emailId: string, reason: string) {
    // Disabled
}
