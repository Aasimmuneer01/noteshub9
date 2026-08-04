const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const startMarker = '        // --- CHAT MANAGER ---';
const endMarker = '        // INITIALIZATION';

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker);

if (startIndex > -1 && endIndex > -1) {
    const oldLogic = html.substring(startIndex, endIndex);
    
    // We recreate the logic
    const topLogic = `        // --- CHAT MANAGER ---
        let chatEnabled = false;
        let aiEnabled = false;
        let communityChatUnsubscribe = null;

        async function loadChatSettings() {
            try {
                const docRef = doc(db, 'website_control', 'settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    chatEnabled = !!data.chatEnabled;
                    aiEnabled = !!data.aiEnabled;
                }
                
                document.getElementById('chat-status-text').textContent = chatEnabled ? 'Enabled' : 'Disabled';
                document.getElementById('chat-status-text').className = chatEnabled ? 'text-green-300' : 'text-red-300';
                
                document.getElementById('toggle-ai-enabled').textContent = aiEnabled ? 'Enabled' : 'Disabled';
                document.getElementById('toggle-ai-enabled').className = aiEnabled ? 'px-6 py-3 bg-green-500/20 text-green-300 rounded-lg font-bold hover:brightness-110 border border-green-500/30' : 'px-6 py-3 bg-red-500/20 text-red-300 rounded-lg font-bold hover:brightness-110 border border-red-500/30';

            } catch (e) {
                console.error("Error loading chat settings", e);
            }
        }

        document.getElementById('toggle-chat-enabled').addEventListener('click', async () => {
            chatEnabled = !chatEnabled;
            try {
                await setDoc(doc(db, 'website_control', 'settings'), { chatEnabled }, { merge: true });
                toast('Chat system ' + (chatEnabled ? 'enabled' : 'disabled'), 'success');
                loadChatSettings();
            } catch (e) {
                toast('Error updating chat settings', 'error');
            }
        });

        document.getElementById('toggle-ai-enabled').addEventListener('click', async () => {
            aiEnabled = !aiEnabled;
            try {
                await setDoc(doc(db, 'website_control', 'settings'), { aiEnabled }, { merge: true });
                toast('AI Chat ' + (aiEnabled ? 'enabled' : 'disabled'), 'success');
                loadChatSettings();
            } catch (e) {
                toast('Error updating AI chat settings', 'error');
            }
        });

        document.getElementById('send-broadcast').addEventListener('click', async () => {
            const msg = document.getElementById('broadcast-message').value.trim();
            if (!msg) return toast('Please enter a message', 'error');
            try {
                const chatRef = collection(db, 'chats', 'community', 'messages');
                await setDoc(doc(chatRef), {
                    content: msg,
                    senderId: 'admin',
                    senderName: 'Admin Broadcast',
                    senderAvatar: '',
                    timestamp: serverTimestamp(),
                    isBroadcast: true
                });
                document.getElementById('broadcast-message').value = '';
                toast('Broadcast sent successfully', 'success');
            } catch(e) {
                console.error(e);
                toast('Error sending broadcast', 'error');
            }
        });

        const modalCommunityChat = document.getElementById('modal-community-chat');\n\n`;

    const newLogic = fs.readFileSync('new_logic.js', 'utf8');
    
    html = html.substring(0, startIndex) + topLogic + newLogic + "\n" + html.substring(endIndex);
    fs.writeFileSync('public/admin.html', html);
    console.log('Replaced logic successfully');
} else {
    console.log('Could not find markers');
}
