const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<section id="chat-manager"[\s\S]*?<\/section>/;
const match = html.match(regex);
if (match) {
    console.log(match[0]);
}
