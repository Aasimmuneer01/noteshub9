const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const targetListener = `        document.getElementById('toggle-global-premium').addEventListener('change', async (e) => {
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

// Remove it from its current place
if (code.includes(targetListener)) {
    code = code.replace(targetListener, '');
} else {
    console.log("Could not find the listener!");
}

// Add it to initEventListeners
const newListener = `
        const togglePremiumBtn = document.getElementById('toggle-global-premium');
        if (togglePremiumBtn) {
            togglePremiumBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                if (!confirm(isChecked ? "Enable Global Free Premium?" : "Disable Global Free Premium?")) {
                    e.target.checked = !isChecked; // revert
                    return;
                }
                
                const statusSpan = document.getElementById('global-premium-status');
                statusSpan.textContent = 'Saving...';
                e.target.disabled = true;
                
                try {
                    const docRef = doc(db, 'website_control', 'settings');
                    await setDoc(docRef, { globalFreePremium: isChecked }, { merge: true });
                    statusSpan.textContent = isChecked ? 'ON' : 'OFF';
                    
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
                    statusSpan.textContent = !isChecked ? 'ON' : 'OFF';
                } finally {
                    e.target.disabled = false;
                }
            });
        }
`;

code = code.replace('function initEventListeners() {', 'function initEventListeners() {' + newListener);

fs.writeFileSync('admin.html', code);
