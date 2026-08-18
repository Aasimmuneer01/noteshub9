const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

code = code.replace(
  /CloudDownload\n  ChevronUp/,
  "CloudDownload,\n  ChevronUp"
);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
