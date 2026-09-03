const fs = require('fs');
let code = fs.readFileSync('src/pages/AIAssistant.tsx', 'utf8');

code = code.replace(
  `console.error("Error fetching assistants:", error);`,
  `console.warn("Could not fetch assistants:", error);`
);

fs.writeFileSync('src/pages/AIAssistant.tsx', code);
