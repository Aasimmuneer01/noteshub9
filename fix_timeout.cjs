const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Replace the click listener logic for ban user in chat
const searchStr = "closeModal();\n                            openUserModal(uid);";
const replaceStr = "closeModal();\n                            setTimeout(() => openUserModal(uid), 350);";

if (html.includes(searchStr)) {
    html = html.replace(searchStr, replaceStr);
    fs.writeFileSync('public/admin.html', html);
    console.log('Fixed timeout');
} else {
    console.log('Could not find string');
}
