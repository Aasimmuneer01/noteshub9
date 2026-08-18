const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

code = code.replace(
  /} from 'lucide-react';/,
  "  ChevronUp, ChevronDown, Maximize\n} from 'lucide-react';"
);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
