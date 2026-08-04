const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<\/section>\s*<div class="space-y-1">\s*<label class="text-\[10px\] text-gray-500 font-bold uppercase ml-4">PDF URL[\s\S]*?<button id="btn-save-resource"[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

if (html.match(regex)) {
    html = html.replace(regex, '</section>');
    fs.writeFileSync('public/admin.html', html);
    console.log('Removed duplicate code');
} else {
    console.log('Could not find duplicate code using regex');
}
