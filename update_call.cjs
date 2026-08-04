const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const targetStr = `document.getElementById('toggle-ai-enabled').className = aiEnabled ? 'px-6 py-3 bg-green-500/20 text-green-300 rounded-lg font-bold hover:brightness-110 border border-green-500/30' : 'px-6 py-3 bg-red-500/20 text-red-300 rounded-lg font-bold hover:brightness-110 border border-red-500/30';`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, targetStr + '\n                loadChatGroups();');
    fs.writeFileSync('public/admin.html', html);
    console.log('Added loadChatGroups call');
} else {
    console.log('Could not find target');
}
