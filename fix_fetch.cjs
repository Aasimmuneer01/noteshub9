const fs = require('fs');
let code = fs.readFileSync('src/components/PDFViewer.tsx', 'utf8');

// Add onSnapshot to imports
code = code.replace(
  /import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase\/firestore';/,
  `import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';`
);

// Replace fetchResource with onSnapshot
const fetchFind = `  useEffect(() => {
    const fetchResource = async () => {
      if (!resourceId) return;
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'resources', resourceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : null;
          if (data) {
            setResource(data as Resource);
          } else {
            setError("Resource data is empty");
          }
        } else {
          setError("Resource not found in database");
        }
      } catch (err: any) {
        console.error("Firestore error:", err);
        setError(\`Failed to fetch resource: \${err.message || 'Unknown error'}\`);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);`;

const fetchReplace = `  useEffect(() => {
    if (!resourceId) return;
    setLoading(true);
    setError(null);
    
    const docRef = doc(db, 'resources', resourceId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setResource(data as Resource);
      } else {
        setError("Resource not found in database");
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError(\`Failed to fetch resource: \${err.message || 'Unknown error'}\`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resourceId]);`;

code = code.replace(fetchFind, fetchReplace);
fs.writeFileSync('src/components/PDFViewer.tsx', code);
