const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const m = code.match(/togglePremiumBtn\.addEventListener\('change', async \(e\) => \{[\s\S]*?\}\);/);
if (m) {
    console.log(m[0]);
} else {
    console.log("NOT FOUND");
}
