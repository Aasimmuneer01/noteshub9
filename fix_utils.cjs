const fs = require('fs');
let code = fs.readFileSync('src/firebase/utils.ts', 'utf8');

code = code.replace(
  `  console.error('Firestore Error: ', JSON.stringify(errInfo));\n  throw new Error(JSON.stringify(errInfo));`,
  `  if (error instanceof Error && error.message.includes("permission")) {
    console.warn('Firestore Permission Denied (ignored): ', errInfo.path);
    return;
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));`
);

fs.writeFileSync('src/firebase/utils.ts', code);
