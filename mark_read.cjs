const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const targetBtn = `<button id="btn-delete-entire-chat" class="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all hidden"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`;

if (html.includes(targetBtn)) {
    const replacement = `<button id="btn-mark-read" class="px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg transition-all" title="Mark as Read"><i data-lucide="check-check" class="w-5 h-5"></i></button>
                    <button id="btn-delete-entire-chat" class="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all hidden" title="Delete Chat"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`;
    html = html.replace(targetBtn, replacement);
    fs.writeFileSync('public/admin.html', html);
    console.log('Added mark read button');
} else {
    console.log('Could not find target button');
}
