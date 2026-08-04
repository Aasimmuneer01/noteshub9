const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const modalStr = `
                <!-- Community Chat Modal -->
                <div id="modal-community-chat" class="bg-surface w-full max-w-4xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden hidden transform transition-all scale-95 opacity-0">
                    <div class="p-8 border-b border-white/5 flex items-center justify-between bg-primary/10">
                        <h3 class="text-xl font-bold uppercase tracking-tight text-primary">Community Chat Moderation</h3>
                        <div class="flex items-center gap-2">
                            <button id="btn-mark-read" class="px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg transition-all" title="Mark as Read"><i data-lucide="check-check" class="w-5 h-5"></i></button>
                            <button id="btn-delete-entire-chat" class="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all hidden" title="Delete Chat"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                            <button class="modal-close p-2 hover:bg-primary/10 rounded-xl transition-all text-primary"><i data-lucide="x"></i></button>
                        </div>
                    </div>
                    <div class="p-8 flex flex-col h-[60vh]">
                        <div id="admin-chat-messages" class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                            <!-- Messages go here -->
                            <div class="text-center text-gray-500 py-10"><i data-lucide="loader" class="animate-spin w-8 h-8 mx-auto mb-2"></i> Loading messages...</div>
                        </div>
                    </div>
                </div>`;

const insertionPoint = `                <!-- Edit Category Modal -->`;
if (html.includes(insertionPoint)) {
    html = html.replace(insertionPoint, modalStr + '\n\n' + insertionPoint);
    fs.writeFileSync('public/admin.html', html);
    console.log('Added modal back');
} else {
    console.log('Could not find insertion point');
}
