const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `
    match /ai_assistants/{docId} {
      allow read, write: if isAdmin();
    }
`;

if (!rules.includes('match /ai_assistants/')) {
    const insertPoint = rules.lastIndexOf('  }\n}');
    rules = rules.substring(0, insertPoint) + newRule + rules.substring(insertPoint);
    fs.writeFileSync('firestore.rules', rules);
    console.log("Added ai_assistants rule.");
} else {
    console.log("ai_assistants rule already exists.");
}
