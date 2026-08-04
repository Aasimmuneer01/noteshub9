const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

const editResourceMatch = html.match(/[\s]*<!-- Edit Resource Modal -->[\s\S]*?<\/div>[\s]*<\/div>[\s]*/);
const editCategoryMatch = html.match(/<!-- Edit Category Modal -->[\s\S]*?<\/div>[\s]*<\/div>[\s]*/);

if (editResourceMatch && editCategoryMatch) {
    const rMatch = editResourceMatch[0];
    const cMatch = editCategoryMatch[0];

    html = html.replace(rMatch, '\n');
    html = html.replace(cMatch, '\n');

    const modalContainerEnd = '    </div>\n\n    <div id="toast-container"';
    
    html = html.replace(modalContainerEnd, rMatch + cMatch + '\n' + modalContainerEnd);
    
    fs.writeFileSync('public/admin.html', html);
    console.log('Modals moved successfully');
} else {
    console.log('Modals not found');
}
