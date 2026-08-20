const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');
const target = `        const togglePremiumBtn = document.getElementById('toggle-global-premium');
        if (togglePremiumBtn) {
            togglePremiumBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                if (!confirm(isChecked ? "Enable Global Free Premium?" : "Disable Global Free Premium?")) {
                    e.target.checked = !isChecked; // revert
                    return;
                }
                
                const statusSpan = document.getElementById('global-premium-status');`;
const replacement = `        const togglePremiumBtn = document.getElementById('toggle-global-premium');
        if (togglePremiumBtn) {
            togglePremiumBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                
                const statusSpan = document.getElementById('global-premium-status');`;
if (content.includes(target)) {
    fs.writeFileSync('admin.html', content.replace(target, replacement));
    console.log('Patched successfully');
} else {
    console.log('Target string not found in admin.html');
}
