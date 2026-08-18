const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const find = `        if (err.name === 'PasswordException') {
          setPdfError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setPdfError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setPdfError("PDF file was not found (404)");
        } else {
          setPdfError(\`Unable to load this PDF. \${err.message || ''}\`);
        }`;

const replace = `        if (err.name === 'PasswordException') {
          setPdfError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setPdfError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setPdfError("PDF file was not found (404)");
        } else if (err.message && err.message.includes('429')) {
          setPdfError("The PDF server is receiving too many requests right now. Please try again in a few minutes.");
        } else {
          setPdfError(\`Unable to load this PDF. \${err.message || ''}\`);
        }`;

if (code.includes(find)) {
  code = code.replace(find, replace);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully rewrote error logic.");
} else {
  console.log("Could not find error logic.");
}
