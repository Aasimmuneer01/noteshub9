const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// 1. Add missing imports
code = code.replace(
  /ChevronRight, Loader2, AlertCircle, Maximize2, Lock,/,
  "ChevronRight, ChevronUp, ChevronDown, Maximize, Loader2, AlertCircle, Maximize2, Lock,"
);

// 2. Find the layout section to replace
const layoutStartStr = "{/* Floating Header */}";
const layoutEndStr = "</div>\n  );\n}";
const layoutStart = code.indexOf(layoutStartStr);
const layoutEnd = code.lastIndexOf(layoutEndStr);

if (layoutStart !== -1 && layoutEnd !== -1) {
  const newLayout = `{/* Main Content Area (Tap to exit fullscreen) */}
      <div 
        className="flex-1 overflow-auto flex justify-center relative z-10 px-2 sm:px-24" 
        style={{
          paddingTop: isFullscreen ? 'env(safe-area-inset-top)' : 'calc(20px + env(safe-area-inset-top))',
          paddingBottom: isFullscreen ? 'env(safe-area-inset-bottom)' : 'calc(140px + env(safe-area-inset-bottom))'
        }}
        ref={containerRef}
        onClick={() => { if (isFullscreen) setIsFullscreen(false); }}
      >
        <div className="p-1 sm:p-4 bg-white/[0.03] backdrop-blur-xl border border-[#ffaa00]/20 rounded-[16px] sm:rounded-[32px] shadow-[0_0_60px_rgba(255,150,0,0.1)] self-start transition-transform duration-300 max-w-full overflow-visible" style={{ transform: \`scale(\${scale})\`, transformOrigin: 'top center' }}>
          <div className="relative rounded-[12px] sm:rounded-[24px] overflow-hidden bg-white w-full h-auto flex justify-center shadow-inner">
           <canvas ref={canvasRef} className={\`block w-full h-auto object-contain \${(pdfLoading || pdfError) ? 'hidden' : ''}\`} />
           
           {pdfLoading && (
             <div className="flex flex-col items-center justify-center w-full h-[60vh] text-black">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#ffaa00]" />
               <p className="text-sm sm:text-lg font-medium">Loading PDF...</p>
             </div>
           )}

           {pdfError && !pdfLoading && (
             <div className="flex flex-col items-center justify-center w-full h-[60vh] text-black p-4 sm:p-8 text-center">
               <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mb-4" />
               <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Unable to load this PDF</h2>
               <p className="text-sm sm:text-base text-gray-500 mb-6">{pdfError}</p>
               <button 
                 onClick={(e) => { e.stopPropagation(); setRetryCount(c => c + 1); }}
                 className="px-5 py-2 sm:px-6 sm:py-2 bg-[#ffaa00] text-white rounded-lg text-sm sm:text-base font-bold shadow-md hover:bg-[#e69900] transition-colors"
               >
                 Retry
               </button>
             </div>
           )}
           
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
            <div className="transform -rotate-45 text-black/5 text-2xl sm:text-6xl font-bold whitespace-nowrap select-none text-center">
              {displayEmail}<br/>{displayEmail}<br/>{displayEmail}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Right Side Floating Controls (Always Visible: Page & Zoom) */}
      <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-4 sm:gap-6 pointer-events-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        
        {/* Page Controls */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-3 sm:py-4 px-1.5 sm:px-2 flex flex-col items-center gap-1 sm:gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            disabled={currentPage <= 1}
            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev - 1); }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white disabled:text-white/30 hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex flex-col items-center justify-center py-1 sm:py-2">
             <span className="text-white text-xs sm:text-sm font-medium leading-none">{currentPage}</span>
             <div className="w-4 sm:w-6 h-[1px] bg-white/30 my-1 sm:my-1.5"></div>
             <span className="text-white/60 text-[10px] sm:text-xs leading-none">{numPages}</span>
          </div>

          <button 
            disabled={currentPage >= numPages}
            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev + 1); }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white disabled:text-white/30 hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-3 sm:py-4 px-1.5 sm:px-2 flex flex-col items-center gap-1 sm:gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(prev + 0.25, 3.0)); }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <span className="text-white text-[10px] sm:text-xs font-medium tracking-wide w-8 sm:w-10 text-center py-1">
            {Math.round(scale * 100)}%
          </span>

          <button 
            onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(prev - 0.25, 0.3)); }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); fitToScreen(); }}
            title="Fit to Screen"
            className="w-8 h-8 sm:w-10 sm:h-10 mt-1 flex items-center justify-center text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full active:scale-95"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Area (Hidden in Fullscreen) */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-[60] pointer-events-none pb-[calc(16px+env(safe-area-inset-bottom))] px-4 sm:px-6 pr-[64px] sm:pr-[96px]" 
            /* Added pr-[] to prevent bottom bar from overlapping with right side controls on small screens */
          >
            <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-[20px] sm:rounded-[32px] p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between shadow-[0_-8px_32px_rgba(0,0,0,0.5)] mx-auto max-w-5xl">
              
              {/* Top Row / Left Side */}
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/resources'); }} 
                  className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-white text-sm sm:text-base font-medium truncate">{resource.title}</h1>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                  className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#ffaa00] rounded-full transition-colors shrink-0 sm:hidden"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Bottom Row / Right Side */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
                  className="px-3 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[#e3a84b] to-[#b87c2b] shadow-[0_4px_15px_rgba(227,168,75,0.3)] flex items-center gap-1 sm:gap-2 border border-[#ffdb99]/40 transition-transform active:scale-95 shrink-0"
                >
                  <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill={isPageSaved ? 'currentColor' : 'none'} />
                  <span className="text-white text-xs sm:text-sm font-semibold">{isPageSaved ? 'Saved' : 'Save'}</span>
                </button>
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    if (isPremium) handleDownload();
                    else alert("Ask the admin to give you the premium access to download any resources");
                  }}
                  className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                >
                  <CloudDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                  className="w-9 h-9 sm:w-12 sm:h-12 items-center justify-center bg-white/5 hover:bg-white/10 text-[#ffaa00] rounded-full transition-colors shrink-0 hidden sm:flex"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    `;
  code = code.substring(0, layoutStart) + newLayout + "\n" + code.substring(layoutEnd);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully rewrote layout block.");
} else {
  console.log("Could not find layout block limits.");
}
