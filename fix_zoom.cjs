const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const zoomStart = code.indexOf('{/* Bottom Right Zoom Slider */}');
const zoomEnd = code.indexOf('{/* Bottom Center Page Navigation */}');

if (zoomStart !== -1 && zoomEnd !== -1) {
  const newZoom = `{/* Bottom Right Zoom Slider */}
      <div className="absolute bottom-28 right-4 sm:right-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] py-4 px-2 sm:px-3 flex flex-col items-center gap-3 sm:gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Plus size={24} />
          </button>
          
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide w-10 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.3))}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Minus size={24} />
          </button>

          <button 
            onClick={fitToScreen}
            title="Fit to Screen"
            className="w-10 h-10 mt-1 flex items-center justify-center text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      `;
  
  code = code.substring(0, zoomStart) + newZoom + code.substring(zoomEnd);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
} else {
  console.log("Could not find zoom slider block");
}
