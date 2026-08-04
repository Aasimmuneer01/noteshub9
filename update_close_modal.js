const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace('[modalUser, modalPremium, modalEditResource, modalEditCategory].forEach(m => {', '[modalUser, modalPremium, modalEditResource, modalEditCategory, modalCommunityChat].forEach(m => {');
html = html.replace('[modalUser, modalPremium, modalEditResource, modalEditCategory].forEach(m => m.classList.add(\'hidden\'));', '[modalUser, modalPremium, modalEditResource, modalEditCategory, modalCommunityChat].forEach(m => m.classList.add(\'hidden\'));\n                if (window.communityChatUnsubscribe) { window.communityChatUnsubscribe(); window.communityChatUnsubscribe = null; }');

fs.writeFileSync('public/admin.html', html);
console.log('Updated closeModal');
