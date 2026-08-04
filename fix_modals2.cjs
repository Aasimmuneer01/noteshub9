const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

const editResourceMatch = html.match(/[\s]*<!-- Edit Resource Modal -->[\s\S]*?<\/div>[\s]*<\/div>[\s]*<\/div>[\s]*/); // actually let's match better

// Let's use string split
const findResource = html.indexOf('<!-- Edit Resource Modal -->');
const findCategory = html.indexOf('<!-- Edit Category Modal -->');

if (findResource > 0 && findCategory > 0) {
    const startResource = findResource;
    const endCategoryStr = '<!-- Upload Content -->';
    const endCategory = html.indexOf(endCategoryStr);
    
    if (endCategory > 0) {
        const modalsHTML = html.substring(startResource, endCategory);
        html = html.substring(0, startResource) + html.substring(endCategory);
        
        const modalContainerEndStr = '    </div>\n\n    <!-- Notifications -->';
        
        html = html.replace(modalContainerEndStr, modalsHTML + modalContainerEndStr);
        
        fs.writeFileSync('public/admin.html', html);
        console.log('Modals moved successfully (attempt 2)');
    }
}

