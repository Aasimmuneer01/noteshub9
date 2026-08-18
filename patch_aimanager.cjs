const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/AIManager.tsx', 'utf8');

if (!code.includes("import React")) {
    code = "import React from 'react';\n" + code;
    fs.writeFileSync('src/components/Admin/AIManager.tsx', code);
    console.log("Added React import to AIManager.tsx");
}
