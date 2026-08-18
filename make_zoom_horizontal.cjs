const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const zoomFind = `{/* Bottom Right Zoom Slider */}
      <div className="absolute bottom-[calc(16px+env(safe-area-inset-bottom))] sm:bottom-[calc(24px+env(safe-area-inset-bottom))] right-4 sm:right-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full sm:rounded-[32px] py-3 sm:py-4 px-1.5 sm:px-3 flex flex-col items-center gap-2 sm:gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          
          <span className="text-white text-[10px] sm:text-sm font-medium tracking-wide w-8 sm:w-10 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.3))}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Minus className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={fitToScreen}
            title="Fit to Screen"
            className="w-8 h-8 sm:w-10 sm:h-10 mt-1 flex items-center justify-center text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>`;

const zoomReplace = `{/* Zoom Controls */}
      <div className="absolute bottom-[calc(64px+env(safe-area-inset-bottom))] sm:bottom-[calc(24px+env(safe-area-inset-bottom))] right-4 sm:right-6 left-4 sm:left-auto flex justify-end sm:justify-center z-[60] pointer-events-none">
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full sm:rounded-[32px] py-1 sm:py-4 px-2 sm:px-3 flex flex-row sm:flex-col items-center gap-1 sm:gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.3))}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95 order-1 sm:order-3"
          >
            <Minus className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <span className="text-white text-[11px] sm:text-sm font-medium tracking-wide w-10 text-center order-2 sm:order-2">
            {Math.round(scale * 100)}%
          </span>

          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95 order-3 sm:order-1"
          >
            <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={fitToScreen}
            title="Fit to Screen"
            className="w-8 h-8 sm:w-10 sm:h-10 ml-2 sm:ml-0 sm:mt-1 flex items-center justify-center text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full active:scale-95 order-4 sm:order-4"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>`;

if (code.includes(zoomFind)) {
  code = code.replace(zoomFind, zoomReplace);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully made zoom horizontal on mobile.");
} else {
  console.log("Could not find zoom code.");
}
