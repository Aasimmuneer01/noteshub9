const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const oldUI = `<div class="mt-6 pt-6 border-t border-white/10 space-y-4">
                                    <h4 class="text-lg font-bold">Global Free Premium</h4>
                                    <p class="text-sm text-gray-500">When enabled, all NotesHub9 users receive 1 year of free Premium membership automatically, including newly registered users.</p>
                                    <div id="global-premium-status" class="font-bold text-gray-400">Status: Loading...</div>
                                    <button id="toggle-global-premium" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110">Toggle Status</button>
                                    
                                </div>`;

const newUI = `<div class="mt-6 pt-6 border-t border-white/10 space-y-4">
                                    <h4 class="text-lg font-bold">Premium Settings</h4>
                                    <h5 class="font-bold text-white">Global Free Premium</h5>
                                    <p class="text-sm text-gray-500">When enabled, every NotesHub9 user receives 1 year of free Premium membership, including all existing users and all users who register while this setting is enabled.</p>
                                    <div id="global-premium-status" class="font-bold text-gray-400">Status: Loading...</div>
                                    <button id="toggle-global-premium" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110">Toggle Status</button>
                                </div>`;

code = code.replace(oldUI, newUI);
fs.writeFileSync('admin.html', code);
