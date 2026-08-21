const fs = require('fs');
const path = require('path');

const analyticsPath = path.join(__dirname, 'api', '_analytics.ts');
const apiPath = path.join(__dirname, 'api', 'index.ts');

let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
analyticsContent = analyticsContent.replace(
    'db = getFirestore();',
    "const config = JSON.parse(require('fs').readFileSync('firebase-applet-config.json', 'utf8'));\n            db = getFirestore(config.firestoreDatabaseId);"
);
fs.writeFileSync(analyticsPath, analyticsContent);

let apiContent = fs.readFileSync(apiPath, 'utf8');
apiContent = apiContent.replace(
    /const db = getFirestore\(\);/g,
    "const config = JSON.parse(require('fs').readFileSync('firebase-applet-config.json', 'utf8'));\n        const db = getFirestore(config.firestoreDatabaseId);"
);
fs.writeFileSync(apiPath, apiContent);

console.log("Patched getFirestore calls to include firestoreDatabaseId");
