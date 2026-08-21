const fs = require('fs');
const p = 'api/index.ts';
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/        \}\);\n        res\.json\(\{ assistants \}\);\n    \} catch \(err\) \{\n        console\.error\('Error fetching assistants:', err\);\n        res\.status\(500\)\.json\(\{ error: 'Failed to fetch assistants' \}\);\n    \}\n\}\);/, '');

fs.writeFileSync(p, content);
