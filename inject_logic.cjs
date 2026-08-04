const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
const logic = fs.readFileSync('chat_logic.js', 'utf8');

const injectionPoint = '        // INITIALIZATION';
if (html.includes(injectionPoint)) {
    html = html.replace(injectionPoint, logic + '\n' + injectionPoint);
    
    // Also we need to call loadChatSettings() inside initializeAdmin()
    const initPoint = 'loadWebsiteControl();';
    if (html.includes(initPoint)) {
        html = html.replace(initPoint, initPoint + '\n                loadChatSettings();');
    }
    
    fs.writeFileSync('public/admin.html', html);
    console.log('Injected logic');
} else {
    console.log('Could not find INITIALIZATION');
}
