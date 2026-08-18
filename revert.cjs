const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const returnIndex = code.lastIndexOf('  return (');
if (returnIndex === -1) {
    console.log("Could not find '  return ('");
    process.exit(1);
}

const beforeReturn = code.substring(0, returnIndex);

const replacement = `  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col font-sans selection:bg-[#ffaa00]/30 selection:text-white pb-[env(safe-area-inset-bottom)]">
      
      {/* Background Ambient Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <CinematicFireAmbient />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
      </div>

      {/* Top Header (Hidden in Fullscreen) */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="relative z-50 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-4 sm:px-6 bg-black/40 backdrop-blur-md border-b border-white/10 gap-4"
            style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/resources'); }} 
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-white text-base sm:text-lg font-medium truncate pr-4">
                {resource.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#e3a84b] to-[#b87c2b] shadow-[0_4px_15px_rgba(227,168,75,0.3)] flex items-center gap-2 border border-[#ffdb99]/40 transition-transform active:scale-95 shrink-0"
              >
                <BookmarkIcon className="w-4 h-4 text-white" fill={isBookmarked ? 'currentColor' : 'none'} />
                <span className="text-white text-sm font-semibold">{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
              
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  if (isPremium) handleDownload();
                  else alert("Ask the admin to give you the premium access to download any resources");
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                title="Download"
              >
                <CloudDownload className="w-5 h-5" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#ffaa00] rounded-full transition-colors shrink-0"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-auto flex justify-center relative z-10 px-2 sm:px-6 py-4 sm:py-8"
        style={{
           paddingTop: isFullscreen ? 'env(safe-area-inset-top)' : undefined
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

      {/* Bottom Controls Area (Hidden in Fullscreen) */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative z-50 p-3 sm:p-6 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between sm:justify-center gap-4 sm:gap-12 pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            {/* Page Controls */}
            <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-2 border border-white/10">
              <button 
                disabled={currentPage <= 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev - 1); }}
                className="p-2 text-white disabled:text-white/30 hover:bg-white/10 transition-colors rounded-full"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                 <span className="text-white text-sm sm:text-base font-medium">{currentPage}</span>
                 <span className="text-white/40">/</span>
                 <span className="text-white/60 text-sm sm:text-base">{numPages}</span>
              </div>

              <button 
                disabled={currentPage >= numPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev + 1); }}
                className="p-2 text-white disabled:text-white/30 hover:bg-white/10 transition-colors rounded-full"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-2 border border-white/10">
              <button 
                onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(prev - 0.25, 0.3)); }}
                className="p-2 text-white hover:bg-white/10 transition-colors rounded-full"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <span className="text-white text-sm font-medium w-12 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button 
                onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(prev + 0.25, 3.0)); }}
                className="p-2 text-white hover:bg-white/10 transition-colors rounded-full"
              >
                <Plus className="w-5 h-5" />
              </button>

              <div className="w-[1px] h-6 bg-white/20 mx-2"></div>

              <button 
                onClick={(e) => { e.stopPropagation(); fitToScreen(); }}
                title="Fit to Screen"
                className="p-2 text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('src/components/PDFViewer.tsx', beforeReturn + replacement);
console.log("Reverted UI successfully via substring.");
