const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /\s*\{\/\*\s*Student Community\s*\*\/\}\s*<section>[\s\S]*?<\/section>/;
const replacement = `\n        <CreatorSection />`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/pages/Home.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Regex not matched!");
}
