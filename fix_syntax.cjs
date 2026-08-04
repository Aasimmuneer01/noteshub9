const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const badStr = '\\`Chat: \\${chatId}\\`';
const goodStr = '`Chat: ${chatId}`';

if (html.includes(badStr)) {
    html = html.replace(badStr, goodStr);
    fs.writeFileSync('public/admin.html', html);
    console.log('Fixed syntax error');
} else {
    console.log('Could not find bad string');
}
