const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

const fitFind = `      // Add padding (48px) to width and height
      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 48;`;

const fitReplace = `      // Calculate actual available space taking padding into account
      const styles = window.getComputedStyle(containerRef.current);
      const pt = parseFloat(styles.paddingTop) || 0;
      const pb = parseFloat(styles.paddingBottom) || 0;
      const pl = parseFloat(styles.paddingLeft) || 0;
      const pr = parseFloat(styles.paddingRight) || 0;
      
      const containerWidth = containerRef.current.clientWidth - pl - pr - 16;
      const containerHeight = containerRef.current.clientHeight - pt - pb - 16;`;

if (code.includes(fitFind)) {
  code = code.replace(fitFind, fitReplace);
  fs.writeFileSync('src/components/PDFViewer.tsx', code);
  console.log("Successfully fixed fitToScreen padding calculation.");
} else {
  console.log("Could not find fitToScreen calculation.");
}
