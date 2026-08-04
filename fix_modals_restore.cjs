const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');
const modalsHTML = fs.readFileSync('modals_restore.html', 'utf8');

const modalContainerEndStr = '    </div>\n\n    <!-- Notifications -->';

if (html.includes(modalContainerEndStr)) {
    html = html.replace(modalContainerEndStr, modalsHTML + '\n' + modalContainerEndStr);
    fs.writeFileSync('public/admin.html', html);
    console.log('Modals restored and moved successfully');
} else {
    console.log('Could not find injection point');
}
