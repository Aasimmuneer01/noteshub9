const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

code = code.replace(
  /ChevronRight, Loader2, AlertCircle, Maximize2, Lock,/,
  "ChevronRight, ChevronUp, ChevronDown, Maximize, Loader2, AlertCircle, Maximize2, Lock,"
);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
