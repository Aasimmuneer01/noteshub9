const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const targetStr = `            const btnDeleteEntire = document.getElementById('btn-delete-entire-chat');`;
const replaceStr = `            const btnMarkRead = document.getElementById('btn-mark-read');
            btnMarkRead.onclick = async () => {
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                            [\`lastReadChats.\${chatId}\`]: serverTimestamp()
                        });
                        toast('Marked as read', 'success');
                    }
                } catch (e) {
                    toast('Error marking as read', 'error');
                }
            };
            
            const btnDeleteEntire = document.getElementById('btn-delete-entire-chat');`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, replaceStr);
    fs.writeFileSync('public/admin.html', html);
    console.log('Added mark read logic');
} else {
    console.log('Could not find target');
}
