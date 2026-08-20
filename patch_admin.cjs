const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

code = code.replace(
  /<button id="grant-premium-existing".*?<\/button>/,
  ""
);

const oldToggleLogic = `        document.getElementById('toggle-global-premium').addEventListener('click', async () => {
            if (!confirm("Enable/Disable Global Free Premium?")) return;
            try {
                const docRef = doc(db, 'website_control', 'settings');
                const docSnap = await getDoc(docRef);
                const data = docSnap.exists() ? docSnap.data() : {};
                const newState = !data.globalFreePremium;
                await updateDoc(docRef, { globalFreePremium: newState });
                document.getElementById('global-premium-status').textContent = 'Status: ' + (newState ? 'ON' : 'OFF');
                toast('Global Free Premium set to ' + (newState ? 'ON' : 'OFF'), 'success');
            } catch (e) {
                toast('Error updating Global Free Premium', 'error');
            }
        });`;

const newToggleLogic = `        document.getElementById('toggle-global-premium').addEventListener('click', async () => {
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
                        const hasActivePremium = userData.isPremium && (userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumExpiry || userData.premiumExpiryDate).toDate() > now;
                        
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

code = code.replace(oldToggleLogic, newToggleLogic);

// Also remove the old grant button logic
const oldGrantLogic = `        document.getElementById('grant-premium-existing').addEventListener('click', async () => {
            if (!confirm("Enable Global Free Premium? This will grant eligible existing users 1 year of free Premium.")) return;
            try {
                toast('Granting Premium to all eligible users...', 'info');
                const usersSnap = await getDocs(collection(db, 'users'));
                const now = new Date();
                const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                
                let count = 0;
                for (const userDoc of usersSnap.docs) {
                    const userData = userDoc.data();
                    if (userData.isPremium && userData.premiumExpiry && userData.premiumExpiry.toDate() > now) {
                        continue;
                    }
                    await updateDoc(userDoc.ref, {
                        isPremium: true,
                        premiumPlan: 'global_free',
                        premiumStart: Timestamp.fromDate(now),
                        premiumExpiry: Timestamp.fromDate(expiry),
                        premiumStatus: 'active'
                    });
                    count++;
                }
                toast("Granted Premium to " + count + " users", "success");
            } catch (e) {
                console.error("Grant Premium Error:", e);
                toast("Error granting Premium: " + e.message, "error");
            }
        });`;

if (code.includes("document.getElementById('grant-premium-existing')")) {
    code = code.replace(oldGrantLogic, "");
}

fs.writeFileSync('admin.html', code);
