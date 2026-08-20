const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (match) fs.writeFileSync('test.mjs', match[1]);
