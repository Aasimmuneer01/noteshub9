const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const find = `  // Load PDF document
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
  }, [resource?.pdfUrl, retryCount]);`;

const replace = `  // Load PDF document
  useEffect(() => {
    if (!resource?.pdfUrl) return;

    let isMounted = true;
    const loadingTask = pdfjsLib.getDocument({
      url: resource.pdfUrl,
    });

    const loadPDF = async () => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        const pdf = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPdfError(null);
          initialScaleCalculated.current = false; // Reset for new PDF
        }
      } catch (err: any) {
        if (!isMounted) return;
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
        if (isMounted) setPdfLoading(false);
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
      try {
        loadingTask.destroy();
      } catch(e) {}
    };
  }, [resource?.pdfUrl, retryCount]);`;

code = code.replace(find, replace);
fs.writeFileSync('src/components/PDFViewer.tsx', code);
