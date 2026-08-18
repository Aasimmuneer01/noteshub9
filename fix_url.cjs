const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const find = `    const loadingTask = pdfjsLib.getDocument({
      url: resource.pdfUrl,
    });`;

const replace = `    let safeUrl = resource.pdfUrl;
    try {
      safeUrl = new URL(resource.pdfUrl).href;
    } catch(e) {}

    const loadingTask = pdfjsLib.getDocument({
      url: safeUrl,
    });`;

code = code.replace(find, replace);
fs.writeFileSync('src/components/PDFViewer.tsx', code);
