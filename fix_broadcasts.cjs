const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const oldBroadcastLogic = `            // BROADCAST HISTORY LISTENER
            const broadcastQuery = query(
                collection(db, 'chats', 'community', 'messages'),
                where('isBroadcast', '==', true),
                orderBy('timestamp', 'desc')
            );
            onSnapshot(broadcastQuery, (snap) => {
                const container = document.getElementById('broadcast-history');
                if (!container) return;
                
                if (snap.empty) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-6">No broadcasts sent yet.</div>';
                    return;
                }
                
                container.innerHTML = '';
                snap.forEach(docSnap => {`;

const newBroadcastLogic = `            // BROADCAST HISTORY LISTENER
            const broadcastQuery = query(
                collection(db, 'chats', 'community', 'messages'),
                where('isBroadcast', '==', true)
            );
            onSnapshot(broadcastQuery, (snap) => {
                const container = document.getElementById('broadcast-history');
                if (!container) return;
                
                if (snap.empty) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-6">No broadcasts sent yet.</div>';
                    return;
                }
                
                // Sort client-side to avoid composite index requirement
                const sortedDocs = [...snap.docs].sort((a, b) => {
                    const tA = a.data().timestamp?.toMillis() || 0;
                    const tB = b.data().timestamp?.toMillis() || 0;
                    return tB - tA; // desc
                });
                
                container.innerHTML = '';
                sortedDocs.forEach(docSnap => {`;

code = code.replace(oldBroadcastLogic, newBroadcastLogic);
fs.writeFileSync('admin.html', code);
