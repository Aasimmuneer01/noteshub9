const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const startMarker = '        async function loadChatGroups() {';
const endMarker = '        // INITIALIZATION';

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker);

if (startIndex > -1 && endIndex > -1) {
    const newLogic = fs.readFileSync('chat_manager_logic.js', 'utf8');
    
    html = html.substring(0, startIndex) + newLogic + "\n" + html.substring(endIndex);
    fs.writeFileSync('public/admin.html', html);
    console.log('Replaced logic successfully');
} else {
    console.log('Could not find markers');
}
