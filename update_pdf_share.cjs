const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// Add handleShare
code = code.replace(
  /const handleDownload = \(\) => {/,
  `const handleShare = async () => {
    if (!resource) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: resource.title,
          text: \`Check out \${resource.title} on NotesHub9!\`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleDownload = () => {`
);

// Attach to button
code = code.replace(
  /<button \n            className="text-white hover:text-white\/80 transition-colors"\n          >\n            <Share2 size=\{28\} \/>\n          <\/button>/,
  `<button 
            onClick={handleShare}
            className="text-white hover:text-white/80 transition-colors"
          >
            <Share2 size={28} />
          </button>`
);

fs.writeFileSync('src/components/PDFViewer.tsx', code);
