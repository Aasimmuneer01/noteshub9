const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const oldGrid = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div class="p-6 bg-black rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold">Global Chat</h4>
                                    <p class="text-sm text-gray-500">Enable/Disable entire chat system</p>
                                </div>
                                <button id="toggle-chat-enabled" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110"><span id="chat-status-text">...</span></button>
                            </div>
                            <div class="p-6 bg-black rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold">NotesHub9 Community</h4>
                                    <p class="text-sm text-gray-500">View and moderate messages</p>
                                </div>
                                <button id="btn-view-community-chat" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110">Manage</button>
                            </div>
                        </div>`;

const newGrid = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div class="p-6 bg-black rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold">Global Chat</h4>
                                    <p class="text-sm text-gray-500">Enable/Disable entire chat system</p>
                                </div>
                                <button id="toggle-chat-enabled" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110"><span id="chat-status-text">...</span></button>
                            </div>
                            <div class="p-6 bg-black rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold">AI Assistant</h4>
                                    <p class="text-sm text-gray-500">Enable/Disable AI in chats</p>
                                </div>
                                <button id="toggle-ai-enabled" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110">Toggle</button>
                            </div>
                            
                            <div class="col-span-1 md:col-span-2 mt-4">
                                <h4 class="text-lg font-black uppercase tracking-tight mb-4">Conversations</h4>
                                <div id="admin-chat-groups" class="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                    <div class="text-center text-gray-500 py-10"><i data-lucide="loader" class="animate-spin w-8 h-8 mx-auto mb-2"></i> Loading conversations...</div>
                                </div>
                            </div>
                        </div>`;

if (html.includes(oldGrid)) {
    html = html.replace(oldGrid, newGrid);
    fs.writeFileSync('public/admin.html', html);
    console.log('HTML updated');
} else {
    console.log('Grid not found');
}
