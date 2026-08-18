const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const find = `    let safeUrl = resource.pdfUrl;
    try {
      safeUrl = new URL(resource.pdfUrl).href;
    } catch(e) {}`;

const replace = `    let safeUrl = resource.pdfUrl;
    try {
      const parsedUrl = new URL(resource.pdfUrl);
      if (parsedUrl.hostname === 'raw.githubusercontent.com') {
        // Rewrite raw.githubusercontent.com to jsdelivr to avoid 429 and CORS
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        if (parts.length >= 3) {
          const user = parts[0];
          const repo = parts[1];
          const branch = parts[2];
          const filePath = parts.slice(3).join('/');
          safeUrl = \`https://cdn.jsdelivr.net/gh/\${user}/\${repo}@\${branch}/\${filePath}\`;
        }
      } else {
        safeUrl = parsedUrl.href;
      }
    } catch(e) {}`;

if (code.includes(find)) {
  code = code.replace(find, replace);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully rewrote github raw url logic.");
} else {
  console.log("Could not find safeUrl logic.");
}
