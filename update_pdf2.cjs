const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// Replace the PDF container wrap
code = code.replace(
  /<div className="relative shadow-\[0_0_40px_rgba\(255,150,0,0\.15\)\] border-2 border-\[#ffaa00\]\/30 rounded-\[24px\] overflow-hidden bg-white max-w-full flex justify-center self-start h-auto transition-transform duration-300" style={{ transform: `scale\(\${scale}\)`, transformOrigin: 'top center' }}>/,
  `<div className="p-2 sm:p-4 bg-white/[0.03] backdrop-blur-xl border border-[#ffaa00]/20 rounded-[32px] shadow-[0_0_60px_rgba(255,150,0,0.1)] self-start transition-transform duration-300 max-w-full overflow-visible" style={{ transform: \`scale(\${scale})\`, transformOrigin: 'top center' }}>
          <div className="relative rounded-[24px] overflow-hidden bg-white w-full h-auto flex justify-center shadow-inner">`
);

// We need to close the extra div
code = code.replace(
  /            <\/div>\n          <\/div>\n        <\/div>\n      <\/div>/,
  `            </div>
          </div>
          </div>
        </div>
      </div>`
);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
