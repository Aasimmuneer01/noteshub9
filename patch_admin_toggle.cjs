const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const oldUI = `<div class="mt-6 pt-6 border-t border-white/10 space-y-4">
                                    <h4 class="text-lg font-bold">Premium Settings</h4>
                                    <h5 class="font-bold text-white">Global Free Premium</h5>
                                    <p class="text-sm text-gray-500">When enabled, every NotesHub9 user receives 1 year of free Premium membership, including all existing users and all users who register while this setting is enabled.</p>
                                    <div id="global-premium-status" class="font-bold text-gray-400">Status: Loading...</div>
                                    <button id="toggle-global-premium" class="px-6 py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110">Toggle Status</button>
                                </div>`;

const newUI = `<div class="mt-6 pt-6 border-t border-white/10 space-y-4">
                                    <div class="flex items-center justify-between">
                                        <h4 class="text-lg font-bold">Premium Settings</h4>
                                    </div>
                                    <div class="bg-black p-5 rounded-xl border border-white/10 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <h5 class="font-bold text-white text-lg">Global Free Premium</h5>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="toggle-global-premium" class="sr-only peer">
                                                <div class="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                                <span id="global-premium-status" class="ml-3 text-sm font-bold text-gray-400">OFF</span>
                                            </label>
                                        </div>
                                        <p class="text-sm text-gray-500">When enabled, every NotesHub9 user receives 1 year of free Premium membership, including all existing users and all users who register while this setting is enabled.</p>
                                    </div>
                                </div>`;

code = code.replace(oldUI, newUI);

const oldLogic = `        document.getElementById('toggle-global-premium').addEventListener('click', async () => {
            if (!confirm("Enable/Disable Global Free Premium?")) return;
            try {
                const docRef = doc(db, 'website_control', 'settings');
                const docSnap = await getDoc(docRef);
                const data = docSnap.exists() ? docSnap.data() : {};
                const newState = !data.globalFreePremium;
                await updateDoc(docRef, { globalFreePremium: newState });
                document.getElementById('global-premium-status').textContent = 'Status: ' + (newState ? 'ON' : 'OFF');
                
                if (newState) {
                    toast('Global Free Premium enabled! Granting to all eligible users...', 'info');
                    const usersSnap = await getDocs(collection(db, 'users'));
                    const now = new Date();
                    const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                    
                    let count = 0;
                    for (const userDoc of usersSnap.docs) {
                        const userData = userDoc.data();
                        
                        // Check if user already has an active premium that hasn't expired yet
                        // If they do, skip unless we need to overwrite. Actually, we should just skip if they have valid premium.
                        const hasActivePremium = userData.isPremium && (userData.premiumPlan === 'Lifetime' || userData.premiumType === 'Lifetime' || ((userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumExpiry || userData.premiumExpiryDate).toDate() > now));
                        
                        if (!hasActivePremium) {
                            await updateDoc(userDoc.ref, {
                                isPremium: true,
                                premiumType: 'global_free',
                                premiumStartDate: Timestamp.fromDate(now),
                                premiumExpiryDate: Timestamp.fromDate(expiry),
                                premiumStatus: 'active'
                            });
                            count++;
                        }
                    }
                    toast("Granted Premium to " + count + " users", "success");
                } else {
                    toast('Global Free Premium set to OFF', 'success');
                }
            } catch (e) {
                console.error("Error updating Global Free Premium:", e);
                toast('Error updating Global Free Premium', 'error');
            }
        });`;

const newLogic = `        document.getElementById('toggle-global-premium').addEventListener('change', async (e) => {
            const isChecked = e.target.checked;
            if (!confirm(isChecked ? "Enable Global Free Premium?" : "Disable Global Free Premium?")) {
                e.target.checked = !isChecked; // revert
                return;
            }
            try {
                const docRef = doc(db, 'website_control', 'settings');
                await setDoc(docRef, { globalFreePremium: isChecked }, { merge: true });
                document.getElementById('global-premium-status').textContent = isChecked ? 'ON' : 'OFF';
                
                if (isChecked) {
                    toast('Global Free Premium enabled! Granting to all eligible users...', 'info');
                    const usersSnap = await getDocs(collection(db, 'users'));
                    const now = new Date();
                    const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                    
                    let count = 0;
                    for (const userDoc of usersSnap.docs) {
                        const userData = userDoc.data();
                        
                        const hasActivePremium = userData.isPremium && (userData.premiumPlan === 'Lifetime' || userData.premiumType === 'Lifetime' || ((userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumExpiry || userData.premiumExpiryDate).toDate() > now));
                        
                        if (!hasActivePremium) {
                            await updateDoc(userDoc.ref, {
                                isPremium: true,
                                premiumType: 'global_free',
                                premiumStartDate: Timestamp.fromDate(now),
                                premiumExpiryDate: Timestamp.fromDate(expiry),
                                premiumStatus: 'active',
                                premiumNotificationShown: false
                            });
                            count++;
                        }
                    }
                    toast("Granted Premium to " + count + " users", "success");
                } else {
                    toast('Global Free Premium set to OFF', 'success');
                }
            } catch (err) {
                console.error("Error updating Global Free Premium:", err);
                toast('Error updating Global Free Premium', 'error');
                e.target.checked = !isChecked; // revert on error
            }
        });`;

code = code.replace(oldLogic, newLogic);

// Fix the status update in loadWebsiteControl
code = code.replace(
    /const globalFreePremium = !!settings\.globalFreePremium;\n\s*document\.getElementById\('global-premium-status'\)\.textContent = 'Status: ' \+ \(globalFreePremium \? 'ON' : 'OFF'\);/,
    `const globalFreePremium = !!settings.globalFreePremium;
                document.getElementById('toggle-global-premium').checked = globalFreePremium;
                document.getElementById('global-premium-status').textContent = globalFreePremium ? 'ON' : 'OFF';`
);

fs.writeFileSync('admin.html', code);
