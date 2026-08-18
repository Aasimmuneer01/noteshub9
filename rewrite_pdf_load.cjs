const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const regex = /let isMounted = true;\s*let safeUrl = resource\.pdfUrl;\s*try \{([\s\S]*?)\}\s*catch\(e\)\s*\{\}\s*const loadingTask = pdfjsLib\.getDocument\(\{\s*url: safeUrl,\s*\}\);\s*const loadPDF = async \(\) => \{([\s\S]*?)loadPDF\(\);\s*return \(\) => \{/m;

const match = code.match(regex);
if (!match) {
  console.log("Could not find match for rewrite.");
  process.exit(1);
}

const replacement = `let isMounted = true;
    let safeUrl = resource.pdfUrl;
    let githubApiUrl = '';

    try {
      const parsedUrl = new URL(resource.pdfUrl);
      if (parsedUrl.hostname === 'raw.githubusercontent.com') {
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        if (parts.length >= 3) {
          const user = parts[0];
          const repo = parts[1];
          const branch = parts[2];
          const filePath = parts.slice(3).join('/');
          safeUrl = \`https://cdn.jsdelivr.net/gh/\${user}/\${repo}@\${branch}/\${filePath}\`;
          githubApiUrl = \`https://api.github.com/repos/\${user}/\${repo}/contents/\${filePath}?ref=\${branch}\`;
        }
      } else {
        safeUrl = parsedUrl.href;
      }
    } catch(e) {}

    let currentLoadingTask: any = null;

    const loadPDF = async (retryUrl = safeUrl) => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        let finalDataConfig: any = { url: retryUrl };
        
        if (retryUrl === githubApiUrl && githubApiUrl) {
           const res = await fetch(githubApiUrl);
           if (!res.ok) throw new Error('GitHub API error ' + res.status);
           const data = await res.json();
           if (data.content) {
             const binaryString = atob(data.content.replace(/\\n/g, ''));
             const len = binaryString.length;
             const bytes = new Uint8Array(len);
             for (let i = 0; i < len; i++) {
               bytes[i] = binaryString.charCodeAt(i);
             }
             finalDataConfig = { data: bytes };
           }
        }

        currentLoadingTask = pdfjsLib.getDocument(finalDataConfig);
        const pdf = await currentLoadingTask.promise;
        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPdfError(null);
          initialScaleCalculated.current = false;
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        // Fallback chain: If jsdelivr or raw fails, try github API
        if (retryUrl !== githubApiUrl && githubApiUrl) {
            console.log("Falling back to GitHub API due to error:", err.message);
            loadPDF(githubApiUrl);
            return;
        }
        
        // If everything failed including fallback (or if no fallback available)
        // Fallback once more to the original URL if we tried jsdelivr originally
        if (retryUrl === githubApiUrl && safeUrl !== resource.pdfUrl) {
             console.log("Falling back to original URL due to API error...");
             loadPDF(resource.pdfUrl);
             githubApiUrl = ''; // Prevent infinite loop
             return;
        }

        console.error("PDF.js loading error:", err);
        if (err.name === 'PasswordException') {
          setPdfError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setPdfError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setPdfError("PDF file was not found (404)");
        } else if (err.message && err.message.includes('429')) {
          setPdfError("The PDF server is receiving too many requests right now. Please try again in a few minutes.");
        } else {
          setPdfError(\`Unable to load this PDF. \${err.message || ''}\`);
        }
      } finally {
        if (isMounted && currentLoadingTask && currentLoadingTask.promise === currentLoadingTask.promise) {
           // We only set false if this was the last task (simplified, just let it be false if success)
           // Actually, since we might recursive call loadPDF, we only set false if we are not falling back
           // But since we returned early on fallback, this finally only runs on success or final failure
           setPdfLoading(false);
        }
      }
    };

    loadPDF();

    return () => {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/PDFViewer.tsx', code);
console.log("Successfully rewrote loadPDF with github api fallback logic.");
