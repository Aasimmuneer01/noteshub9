const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// 1. Imports
code = code.replace(
  /1, MessageSquare, Plus, Trash2, Edit2, Crown,/,
  `1, MessageSquare, Plus, Minus, Trash2, Edit2, Crown,`
);

// 2. State & Refs
const stateRefsFind = `  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const renderGenerationRef = useRef(0);
  const textLayerRenderTaskRef = useRef<any>(null);`;

const stateRefsReplace = `  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const renderGenerationRef = useRef(0);
  const initialScaleCalculated = useRef(false);`;

code = code.replace(stateRefsFind, stateRefsReplace);

// 3. calculateInitialScale & loadPDF
const loadPdfFind = `  // Load PDF document
  useEffect(() => {
    if (!resource?.pdfUrl) return;

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: resource.pdfUrl,
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (err: any) {
        console.error("PDF.js loading error:", err);
        if (err.name === 'PasswordException') {
          setError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setError("PDF file was not found (404)");
        } else {
          setError(\`Failed to load PDF: \${err.message || 'CORS or Network error'}. Please try downloading instead.\`);
        }
      }
    };

    loadPDF();
  }, [resource?.pdfUrl]);`;

const loadPdfReplace = `  const fitToScreen = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      // Add padding (48px) to width and height
      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 48;
      
      const scaleWidth = containerWidth / viewport.width;
      const scaleHeight = containerHeight / viewport.height;
      
      // Use the smaller scale to fit the whole page
      let newScale = Math.min(scaleWidth, scaleHeight);
      newScale = Math.max(0.3, Math.min(newScale, 3.0));
      
      setScale(newScale);
    } catch (err) {
      console.error("Scale calc error:", err);
    }
  }, [pdfDoc]);

  // Load PDF document
  useEffect(() => {
    if (!resource?.pdfUrl) return;

    const loadPDF = async () => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: resource.pdfUrl,
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPdfError(null);
        initialScaleCalculated.current = false; // Reset for new PDF
      } catch (err: any) {
        console.error("PDF.js loading error:", err);
        if (err.name === 'PasswordException') {
          setPdfError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setPdfError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setPdfError("PDF file was not found (404)");
        } else {
          setPdfError(\`Unable to load this PDF. \${err.message || ''}\`);
        }
      } finally {
        setPdfLoading(false);
      }
    };

    loadPDF();
  }, [resource?.pdfUrl, retryCount]);

  useEffect(() => {
    if (pdfDoc && !initialScaleCalculated.current && containerRef.current) {
      fitToScreen();
      initialScaleCalculated.current = true;
    }
  }, [pdfDoc, fitToScreen]);`;

code = code.replace(loadPdfFind, loadPdfReplace);

// 4. Loading States & Top-level rendering
const topLevelFind = `  if (loading) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-white animate-pulse">please wait until the pdf view is loading</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{error || "Something went wrong"}</h2>
        <button onClick={() => navigate('/resources')} className="mt-4 px-6 py-2 bg-primary text-secondary rounded-lg font-bold">
          Go Back
        </button>
      </div>
    );
  }`;

const topLevelReplace = `  if (loading || (resource && !resource.pdfUrl && !error)) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-white animate-pulse">Loading resource metadata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
        <button onClick={() => navigate('/resources')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold">
          Go Back
        </button>
      </div>
    );
  }`;

code = code.replace(topLevelFind, topLevelReplace);

// 5. PDF Container Loading / Error states
const canvasFind = `           <canvas ref={canvasRef} className="block w-full h-auto object-contain" />`;

const canvasReplace = `           <canvas ref={canvasRef} className={\`block w-full h-auto object-contain \${(pdfLoading || pdfError) ? 'hidden' : ''}\`} />
           
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
           )}`;

code = code.replace(canvasFind, canvasReplace);

// 6. Replace Zoom slider
const zoomSliderFind = `      {/* Bottom Right Zoom Slider */}
      <div className="absolute bottom-28 right-6 z-\[60\]">
        <div className="bg-black\/40 backdrop-blur-md border border-white\/10 rounded-\[32px\] py-6 px-3 flex flex-col items-center gap-4 shadow-\[0_8px_32px_rgba\\(0,0,0,0\\.5\\)\]">
          <button 
            onClick={() => setScale\\(1\\.5\\)}
            className="text-white hover:text-white\/80 transition-colors"
          >
            <RefreshCw size={20} \/>
          <\/button>
          
          <span className="text-white text-sm font-medium tracking-wide">
            {Math\\.round\\(scale \\* 100\\)}%
          <\/span>

          <div className="h-40 w-12 flex items-center justify-center relative">
             <input
                type="range"
                min="0\\.5"
                max="3"
                step="0\\.1"
                value={scale}
                onChange={\\(e\\) => setScale\\(parseFloat\\(e\\.target\\.value\\)\\)}
                className="w-40 h-\\[4px\\] bg-black\/60 rounded-full appearance-none outline-none transform -rotate-90 origin-center absolute custom-zoom-slider"
             \/>
          <\/div>
        <\/div>
      <\/div>`;

const zoomSliderReplace = `      {/* Bottom Right Zoom Slider */}
      <div className="absolute bottom-28 right-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] py-4 px-3 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full"
          >
            <Plus size={24} />
          </button>
          
          <span className="text-white text-sm font-medium tracking-wide">
            {Math.round(scale * 100)}%
          </span>

          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.3))}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors rounded-full"
          >
            <Minus size={24} />
          </button>

          <button 
            onClick={fitToScreen}
            title="Fit to Screen"
            className="w-10 h-10 mt-2 flex items-center justify-center text-[#ffaa00] hover:bg-white/10 transition-colors rounded-full"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>`;

code = code.replace(new RegExp(zoomSliderFind), zoomSliderReplace);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
