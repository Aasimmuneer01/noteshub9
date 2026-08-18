const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const replacementFind = `{/* Floating Header */}
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
        <div className="p-2 sm:p-4 bg-white/[0.03] backdrop-blur-xl border border-[#ffaa00]/20 rounded-[32px] shadow-[0_0_60px_rgba(255,150,0,0.1)] self-start transition-transform duration-300 max-w-full overflow-visible" style={{ transform: \`scale(\${scale})\`, transformOrigin: 'top center' }}>
          <div className="relative rounded-[24px] overflow-hidden bg-white w-full h-auto flex justify-center shadow-inner">
           <canvas ref={canvasRef} className={\`block w-full h-auto object-contain \${(pdfLoading || pdfError) ? 'hidden' : ''}\`} />
           
           {pdfLoading && (
             <div className="flex flex-col items-center justify-center w-full h-[60vh] text-black">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#ffaa00]" />
               <p className="text-lg font-medium">Loading PDF...</p>
             </div>
           )}

           {pdfError && !pdfLoading && (
             <div className="flex flex-col items-center justify-center w-full h-[60vh] text-black p-8 text-center">
               <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
               <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to load this PDF</h2>
               <p className="text-gray-500 mb-6">{pdfError}</p>
               <button 
                 onClick={() => setRetryCount(c => c + 1)}
                 className="px-6 py-2 bg-[#ffaa00] text-white rounded-lg font-bold shadow-md hover:bg-[#e69900] transition-colors"
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
            <div className="transform -rotate-45 text-black/5 text-4xl sm:text-6xl font-bold whitespace-nowrap select-none text-center">
              {displayEmail}<br/>{displayEmail}<br/>{displayEmail}
            </div>
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
            onClick={handleShare}
            className="text-white hover:text-white/80 transition-colors"
          >
            <Share2 size={28} />
          </button>
        </div>
      </div>

      {/* Bottom Right Zoom Slider */}
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
      </div>`;

const replacementReplace = `{/* Floating Header */}
      <div className="absolute top-4 sm:top-6 left-4 right-4 z-[60] pt-[env(safe-area-inset-top)]">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] sm:rounded-[20px] p-2 sm:p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('/resources')} className="text-white hover:text-white/80 transition-colors p-1.5 sm:p-2">
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
          
          <div className="flex-1 text-center px-2 sm:px-4 min-w-0">
            <h1 className="text-white text-sm sm:text-xl font-medium tracking-wide truncate">
              {resource.title}
            </h1>
          </div>

          <button className="text-white hover:text-white/80 transition-colors p-1.5 sm:p-2">
            <MoreVertical className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex justify-center relative z-10 pt-[calc(80px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] px-2 sm:px-24" ref={containerRef}>
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
                 onClick={() => setRetryCount(c => c + 1)}
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

      {/* Top Right Floating Action Button (Bookmark) */}
      <div className="absolute top-[88px] sm:top-28 right-4 sm:right-6 z-[60] pt-[env(safe-area-inset-top)]">
        <button 
          onClick={toggleBookmark}
          className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#e3a84b] to-[#b87c2b] shadow-[0_10px_30px_rgba(227,168,75,0.4)] flex items-center justify-center border border-[#ffdb99]/40 transition-transform active:scale-95"
        >
          <BookmarkIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-md" fill="white" />
        </button>
      </div>

      {/* Middle Right Toolbar (Save, Download, Share) */}
      <div className="absolute top-[160px] sm:top-1/2 sm:-translate-y-1/2 right-4 sm:right-6 z-[60] pt-[env(safe-area-inset-top)]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full sm:rounded-[32px] py-4 sm:py-8 px-2 sm:px-4 flex flex-col gap-4 sm:gap-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={handleSavePage}
            className={\`transition-colors flex items-center justify-center \${isPageSaved ? 'text-[#e3a84b]' : 'text-white hover:text-white/80'}\`}
          >
            <BookmarkIcon className="w-5 h-5 sm:w-7 sm:h-7" fill={isPageSaved ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={() => {
              if (isPremium) handleDownload();
              else alert("Ask the admin to give you the premium access to download any resources");
            }}
            className="text-white hover:text-white/80 transition-colors flex items-center justify-center"
          >
            <CloudDownload className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>

          <button 
            onClick={handleShare}
            className="text-white hover:text-white/80 transition-colors flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>

      {/* Bottom Right Zoom Slider */}
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
      </div>

      {/* Bottom Center Page Navigation */}
      <div className="absolute bottom-[calc(16px+env(safe-area-inset-bottom))] sm:bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 sm:left-1/2 sm:-translate-x-1/2 z-[60] w-max max-w-[calc(100vw-80px)] sm:max-w-none">
         <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 sm:px-6 py-2 sm:py-4 flex items-center gap-2 sm:gap-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="text-white disabled:text-white/30 hover:text-white/80 transition-colors p-1 sm:p-0"
            >
              <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
            
            <div className="flex items-baseline justify-center gap-1 sm:gap-2 text-white min-w-[60px] sm:min-w-0">
               <span className="text-lg sm:text-3xl font-light">{currentPage}</span>
               <span className="text-[10px] sm:text-sm font-medium text-white/60 tracking-wider whitespace-nowrap">of {numPages}</span>
            </div>

            <button 
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="text-white disabled:text-white/30 hover:text-white/80 transition-colors p-1 sm:p-0"
            >
              <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
         </div>
      </div>`;

if (code.includes(replacementFind)) {
  code = code.replace(replacementFind, replacementReplace);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully replaced layout code.");
} else {
  console.log("Could not find the target string to replace in PDFViewer.tsx");
}
