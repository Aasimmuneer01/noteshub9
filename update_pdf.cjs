const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// Update imports
code = code.replace(
  /import { \n  Download, Printer, X, ChevronLeft, ChevronRight, Loader2, \n  AlertCircle, Maximize2, Lock, Bookmark as BookmarkIcon, \n  FileText, Highlighter, Save, Search, Settings, \n  List, MessageSquare, Plus, Trash2, Edit2, Crown\n} from 'lucide-react';/,
  `import { 
  Download, Printer, X, ChevronLeft, ChevronRight, Loader2, 
  AlertCircle, Maximize2, Lock, Bookmark as BookmarkIcon, 
  FileText, Highlighter, Save, Search, Settings, 
  List, MessageSquare, Plus, Trash2, Edit2, Crown,
  MoreVertical, Share2, RefreshCw, CloudDownload
} from 'lucide-react';`
);

const returnStart = code.indexOf('  return (\n    <div ref={viewerRef} className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden select-none"');
const newReturn = `  return (
    <div ref={viewerRef} className="fixed inset-0 bg-[#020000] z-50 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      <CinematicFireAmbient />
      
      {/* Background layer to dim fire slightly beneath UI */}
      <div className="absolute inset-0 bg-black/40 z-[5] pointer-events-none" />

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-[60]">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('/resources')} className="text-white hover:text-white/80 transition-colors p-2">
            <ChevronLeft size={28} />
          </button>
          
          <div className="flex-1 text-center px-4">
            <h1 className="text-white text-lg sm:text-xl font-medium tracking-wide">
              {resource.title}
            </h1>
          </div>

          <button className="text-white hover:text-white/80 transition-colors p-2">
            <MoreVertical size={28} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex justify-center relative z-10 pt-28 pb-32 px-4 sm:px-24" ref={containerRef}>
        <div className="relative shadow-[0_0_40px_rgba(255,150,0,0.15)] border-2 border-[#ffaa00]/30 rounded-[24px] overflow-hidden bg-white max-w-full flex justify-center self-start h-auto transition-transform duration-300" style={{ transform: \`scale(\${scale})\`, transformOrigin: 'top center' }}>
           <canvas ref={canvasRef} className="block w-full h-auto object-contain" />
           
           {/* Highlights Layer */}
            {isPremium && highlights.filter(h => h.page === currentPage).map(h => (
              <div 
                key={h.id}
                className="absolute pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                  left: \`\${(h.data.x / 100) * 100}%\`,
                  top: \`\${(h.data.y / 100) * 100}%\`,
                  width: \`\${(h.data.w / 100) * 100}%\`,
                  height: \`\${(h.data.h / 100) * 100}%\`,
                  backgroundColor: h.color
                }}
              />
            ))}

            {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="transform -rotate-45 text-black/5 text-4xl sm:text-6xl font-bold whitespace-nowrap select-none text-center">
              {displayEmail}<br/>{displayEmail}<br/>{displayEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Floating Action Button (Bookmark) */}
      <div className="absolute top-28 right-6 z-[60]">
        <button 
          onClick={toggleBookmark}
          className="w-16 h-16 rounded-full bg-gradient-to-b from-[#e3a84b] to-[#b87c2b] shadow-[0_10px_30px_rgba(227,168,75,0.4)] flex items-center justify-center border border-[#ffdb99]/40 transition-transform active:scale-95"
        >
          <BookmarkIcon size={28} fill="white" className="text-white drop-shadow-md" />
        </button>
      </div>

      {/* Middle Right Toolbar (Save, Download, Share) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] py-8 px-4 flex flex-col gap-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={handleSavePage}
            className={\`transition-colors \${isPageSaved ? 'text-[#e3a84b]' : 'text-white hover:text-white/80'}\`}
          >
            <BookmarkIcon size={28} fill={isPageSaved ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={() => {
              if (isPremium) handleDownload();
              else alert("Ask the admin to give you the premium access to download any resources");
            }}
            className="text-white hover:text-white/80 transition-colors"
          >
            <CloudDownload size={28} />
          </button>

          <button 
            className="text-white hover:text-white/80 transition-colors"
          >
            <Share2 size={28} />
          </button>
        </div>
      </div>

      {/* Bottom Right Zoom Slider */}
      <div className="absolute bottom-28 right-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] py-6 px-3 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setScale(1.5)}
            className="text-white hover:text-white/80 transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          
          <span className="text-white text-sm font-medium tracking-wide">
            {Math.round(scale * 100)}%
          </span>

          <div className="h-40 w-12 flex items-center justify-center relative">
             <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-40 h-[4px] bg-black/60 rounded-full appearance-none outline-none transform -rotate-90 origin-center absolute custom-zoom-slider"
             />
          </div>
        </div>
      </div>

      {/* Bottom Center Page Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60]">
         <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-4 flex items-center gap-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="text-white disabled:text-white/30 hover:text-white/80 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            
            <div className="flex items-baseline gap-2 text-white">
               <span className="text-3xl font-light">{currentPage}</span>
               <span className="text-sm font-medium text-white/60 tracking-wider">of {numPages}</span>
            </div>

            <button 
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="text-white disabled:text-white/30 hover:text-white/80 transition-colors"
            >
              <ChevronRight size={28} />
            </button>
         </div>
      </div>
    </div>
  );
}`;

code = code.substring(0, returnStart) + newReturn + '\n}\n';

fs.writeFileSync('src/components/PDFViewer.tsx', code);
