import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/utils';
import { Resource, Bookmark, ReadingHistory, Note, AppHighlight } from '../types';
import { 
  Download, Printer, X, ChevronLeft, ChevronRight, Loader2, 
  AlertCircle, Maximize2, Lock, Bookmark as BookmarkIcon, 
  FileText, Highlighter, Save, Search, Settings, 
  List, MessageSquare, Plus, Trash2, Edit2, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Set up the worker using a reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function PDFViewer() {
  const { resourceId } = useParams();
  const { userData, user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const renderGenerationRef = useRef(0);
  const textLayerRenderTaskRef = useRef<any>(null);

  // Premium Features States
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSavedPages, setShowSavedPages] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [progress, setProgress] = useState(0);
  const [highlights, setHighlights] = useState<AppHighlight[]>([]);
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [isPageSaved, setIsPageSaved] = useState(false);
  const [secondsSpent, setSecondsSpent] = useState(0);

  const displayEmail = userData?.email || user?.email || 'Unauthorized';

  const lastSavedRef = useRef<{ page: number, scale: number }>({ page: currentPage, scale: scale });
  const hasIncrementedViewCount = useRef(false);
  const secondsAccRef = useRef(0);

  // Study Time Tracker
  useEffect(() => {
    if (!isPremium || !user || !resourceId) return;

    const interval = setInterval(() => {
      setSecondsSpent(prev => prev + 1);
      secondsAccRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPremium, user, resourceId]);

  // Periodic Save & On Close
  useEffect(() => {
    if (!isPremium || !user || !resource || !numPages) return;

    const saveStats = async (isClosing = false) => {
      const timeToSave = secondsAccRef.current;
      if (timeToSave === 0 && !isClosing) return;
      
      const path = `users/${user.uid}/history/${resource.id}`;
      try {
        const historyRef = doc(db, 'users', user.uid, 'history', resource.id);
        await setDoc(historyRef, {
          resourceId: resource.id,
          resourceTitle: resource.title,
          lastPage: currentPage,
          totalPages: numPages,
          percentage: Math.round((currentPage / numPages) * 100),
          zoom: scale,
          timeSpent: increment(timeToSave),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Only increment viewCount once per session (when time is first recorded)
        if (!hasIncrementedViewCount.current && timeToSave > 0) {
           updateDoc(doc(db, 'resources', resource.id), {
             viewCount: increment(1)
           }).catch(err => {
             handleFirestoreError(err, OperationType.UPDATE, `resources/${resource.id}`);
           });
           hasIncrementedViewCount.current = true;
        }

        secondsAccRef.current = 0;
        lastSavedRef.current = { page: currentPage, scale: scale };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    };

    // Auto-save every 30 seconds
    const autoSaveTimer = setInterval(() => {
      if (secondsAccRef.current >= 30) {
        saveStats();
      }
    }, 10000);

    // Save on significant changes (page or scale) after a short delay
    const timeout = setTimeout(() => {
      if (currentPage !== lastSavedRef.current.page || Math.abs(scale - lastSavedRef.current.scale) > 0.1) {
        saveStats();
      }
    }, 5000);

    return () => {
      clearInterval(autoSaveTimer);
      clearTimeout(timeout);
      // Final save on unmount if there's significant activity
      if (secondsAccRef.current > 5) {
        saveStats(true);
      }
    };
  }, [currentPage, scale, isPremium, user, resource, numPages]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
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
        setError(`Failed to fetch resource: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

  // Load PDF document
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
          setError(`Failed to load PDF: ${err.message || 'CORS or Network error'}. Please try downloading instead.`);
        }
      }
    };

    loadPDF();
  }, [resource?.pdfUrl]);

  // Load Premium Data (Bookmarks, History, Notes, Highlights)
  useEffect(() => {
    if (!isPremium || !user || !resourceId) return;

    const loadPremiumData = async () => {
      try {
        // Check Bookmark
        const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', resourceId);
        const bookmarkSnap = await getDoc(bookmarkRef);
        setIsBookmarked(bookmarkSnap.exists());

        // Load History (Reading Resume)
        const historyRef = doc(db, 'users', user.uid, 'history', resourceId);
        const historySnap = await getDoc(historyRef);
        if (historySnap.exists()) {
          const data = historySnap.data();
          if (data.lastPage) setCurrentPage(data.lastPage);
          if (data.zoom) setScale(data.zoom);
        }

        // Load Notes
        const notesQuery = query(
          collection(db, 'users', user.uid, 'notes'),
          where('resourceId', '==', resourceId)
        );
        const notesSnap = await getDocs(notesQuery);
        setNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));

        // Load Highlights
        const highlightsQuery = query(
          collection(db, 'users', user.uid, 'highlights'),
          where('resourceId', '==', resourceId)
        );
        const highlightsSnap = await getDocs(highlightsQuery);
        setHighlights(highlightsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppHighlight)));
      } catch (err) {
        console.error("Error loading premium data:", err);
      }
    };

    loadPremiumData();
  }, [isPremium, user, resourceId]);

  // Check if current page is saved
  useEffect(() => {
    if (!isPremium || !user || !resourceId) return;
    const checkSaved = async () => {
      const q = query(
        collection(db, 'users', user.uid, 'notes'),
        where('resourceId', '==', resourceId),
        where('page', '==', currentPage),
        where('isSavedPage', '==', true)
      );
      const snap = await getDocs(q);
      setIsPageSaved(!snap.empty);
    };
    checkSaved();
  }, [currentPage, isPremium, user, resourceId]);

  // Update Progress and History
  useEffect(() => {
    if (!numPages) return;
    setProgress(Math.round((currentPage / numPages) * 100));
  }, [currentPage, numPages]);

  const toggleBookmark = async () => {
    if (!isPremium || !user || !resource) return;
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', resource.id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          userId: user.uid,
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceThumbnail: resource.thumbnailUrl || '',
          createdAt: serverTimestamp()
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const handleAddNote = async () => {
    if (!isPremium || !user || !resource || !newNote.trim()) return;
    setIsSavingNote(true);
    try {
      const noteRef = doc(collection(db, 'users', user.uid, 'notes'));
      const noteData: Omit<Note, 'id'> = {
        userId: user.uid,
        resourceId: resource.id,
        page: currentPage,
        content: newNote.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(noteRef, noteData);
      setNotes(prev => [...prev, { id: noteRef.id, ...noteData } as Note]);
      setNewNote('');
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!isPremium || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const handleAddHighlight = async () => {
    if (!isPremium || !user || !resource) return;
    try {
      const highlightRef = doc(collection(db, 'users', user.uid, 'highlights'));
      const highlightData: Omit<AppHighlight, 'id'> = {
        userId: user.uid,
        resourceId: resource.id,
        page: currentPage,
        type: 'area',
        data: { x: 10, y: 10, w: 100, h: 50 }, // Simplified static highlight for demo/MVP
        color: '#facc15',
        createdAt: serverTimestamp()
      };
      await setDoc(highlightRef, highlightData);
      setHighlights(prev => [...prev, { id: highlightRef.id, ...highlightData } as AppHighlight]);
    } catch (err) {
      console.error("Error adding highlight:", err);
    }
  };

  const deleteHighlight = async (id: string) => {
    if (!isPremium || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'highlights', id));
      setHighlights(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Error deleting highlight:", err);
    }
  };

  const handleSavePage = async () => {
    if (!isPremium || !user || !resource) return;
    try {
      const q = query(
        collection(db, 'users', user.uid, 'notes'),
        where('resourceId', '==', resource.id),
        where('page', '==', currentPage),
        where('isSavedPage', '==', true)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Unsave
        await deleteDoc(doc(db, 'users', user.uid, 'notes', snap.docs[0].id));
        setIsPageSaved(false);
      } else {
        // Save
        const noteRef = doc(collection(db, 'users', user.uid, 'notes'));
        await setDoc(noteRef, {
          userId: user.uid,
          resourceId: resource.id,
          page: currentPage,
          content: 'Saved Page',
          isSavedPage: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setIsPageSaved(true);
      }
    } catch (err) {
      console.error("Error saving page:", err);
    }
  };

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const generation = ++renderGenerationRef.current;
      
      try {
        // Cancel existing render task if any
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        }

        const page = await pdfDoc.getPage(currentPage);
        if (generation !== renderGenerationRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d', { alpha: false })!;

        // Adjust for device pixel ratio
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = outputScale !== 1 
          ? [outputScale, 0, 0, outputScale, 0, 0] 
          : null;

        const renderContext = {
          canvasContext: context,
          transform: transform || undefined,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        
        if (generation === renderGenerationRef.current) {
          renderTaskRef.current = null;
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException' || generation !== renderGenerationRef.current) return;
        console.error("Error rendering PDF page:", err);
      }
    };

    renderPage();
    
    return () => {
      renderGenerationRef.current++;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (!isPremium || !resource) return;
    
    // Increment count in background if authenticated
    if (auth.currentUser) {
      const path = `resources/${resource.id}`;
      updateDoc(doc(db, 'resources', resource.id), {
        downloadCount: increment(1)
      }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, path);
      });
    }

    // Open in new tab immediately to avoid popup blocker
    try {
      const win = window.open(resource.pdfUrl, '_blank');
      if (!win) {
        // Fallback if blocked
        window.location.href = resource.pdfUrl;
      }
    } catch (err) {
      console.error("Download redirection failed:", err);
      window.location.href = resource.pdfUrl;
    }
  };

  if (loading) {
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
  }

  return (
    <div ref={viewerRef} className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Reading Progress Bar */}
      {isPremium && (
        <div className="absolute top-0 left-0 w-full h-1 bg-surface z-[60]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary shadow-[0_0_8px_#0ea5e9]"
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-secondary p-4 flex items-center justify-between border-b border-surface">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resources')} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <h1 className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{resource.title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isPremium && (
            <button 
              onClick={toggleBookmark}
              className={`p-2 transition-colors ${isBookmarked ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
              title="Bookmark Resource"
            >
              <BookmarkIcon size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          )}

          <button 
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-light text-text-main rounded-lg transition-colors text-sm border border-surface-border"
          >
            <Maximize2 size={18} />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
          
          <button 
            onClick={() => {
              if (isPremium) {
                window.print();
              } else {
                alert("Ask the admin to give you the premium access to print any resources");
              }
            }} 
            className="p-2 text-gray-400 hover:text-text-main transition-colors"
            title="Print"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              if (isPremium) {
                handleDownload();
              } else {
                alert("Ask the admin to give you the premium access to download any resources");
              }
            }} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              isPremium 
                ? 'bg-primary text-secondary' 
                : 'bg-secondary text-gray-500 border border-surface hover:text-gray-300'
            }`}
          >
            {isPremium ? <Download size={18} /> : <Lock size={18} />}
            <span className="hidden sm:inline">Download</span>
          </button>

          {!isPremium && (
            <div className="hidden xs:block px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs font-bold uppercase">
              Free Preview
            </div>
          )}
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-zinc-900 p-4 flex justify-center relative" ref={containerRef}>
          <div className="relative inline-block shadow-2xl">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
            
            {/* Highlights Layer */}
            {isPremium && highlights.filter(h => h.page === currentPage).map(h => (
              <div 
                key={h.id}
                className="absolute pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                  left: `${(h.data.x / 100) * 100}%`,
                  top: `${(h.data.y / 100) * 100}%`,
                  width: `${(h.data.w / 100) * 100}%`,
                  height: `${(h.data.h / 100) * 100}%`,
                  backgroundColor: h.color
                }}
              />
            ))}

            {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="transform -rotate-45 text-white/5 text-4xl sm:text-6xl font-bold whitespace-nowrap select-none text-center">
              {displayEmail}<br/>{displayEmail}<br/>{displayEmail}
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-20">
             <div className="grid grid-cols-2 gap-20 transform -rotate-12 select-none">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="text-white/10 text-lg font-mono">
                    {displayEmail}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

        {/* Sidebar (Saved Pages) */}
        <AnimatePresence>
          {showSavedPages && (
            <motion.div 
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-secondary border-l border-surface flex flex-col z-50"
            >
              <div className="p-4 border-b border-surface flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Save size={18} className="text-primary" />
                  My Saved Pages
                </h3>
                <button onClick={() => setShowSavedPages(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {notes.filter(n => n.isSavedPage).length === 0 ? (
                  <div className="text-center py-12">
                    <Save className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm italic px-8">No saved pages yet. Click the save icon in the footer to bookmark specific pages.</p>
                  </div>
                ) : (
                  notes.filter(n => n.isSavedPage).sort((a,b) => a.page - b.page).map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setCurrentPage(item.page)}
                      className={`w-full p-4 flex items-center justify-between rounded-2xl border transition-all ${
                        currentPage === item.page 
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-surface border-surface-border text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          currentPage === item.page ? 'bg-primary text-secondary' : 'bg-secondary text-gray-500'
                        }`}>
                          {item.page}
                        </div>
                        <span className="font-bold">Page {item.page}</span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar (Notes) */}
        <AnimatePresence>
          {showNotes && (
            <motion.div 
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-secondary border-l border-surface flex flex-col z-50"
            >
              <div className="p-4 border-b border-surface flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  Notes (Page {currentPage})
                </h3>
                <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {notes.filter(n => n.page === currentPage && !n.isSavedPage).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm italic">No notes for this page yet.</p>
                  </div>
                ) : (
                  notes.filter(n => n.page === currentPage && !n.isSavedPage).map(note => (
                    <div key={note.id} className="bg-surface p-3 rounded-lg border border-surface-border group">
                      <p className="text-text-main text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="mt-2 flex justify-end">
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-surface space-y-3">
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your note here..."
                  className="w-full bg-background-main border border-surface rounded-lg p-3 text-sm text-text-main focus:border-primary outline-none resize-none h-24"
                />
                <button 
                  onClick={handleAddNote}
                  disabled={isSavingNote || !newNote.trim()}
                  className="w-full py-2 bg-primary text-secondary font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingNote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Note
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="bg-secondary p-4 border-t border-surface flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isPremium && (
            <>
              <button 
                onClick={() => {
                  setShowSavedPages(!showSavedPages);
                  setShowNotes(false);
                }}
                className={`p-2 rounded-lg transition-all ${showSavedPages ? 'bg-primary text-secondary' : 'text-gray-400 hover:bg-surface'}`}
                title="My Saved Pages"
              >
                <List size={20} />
              </button>
              <button 
                onClick={() => {
                  setShowNotes(!showNotes);
                  setShowSavedPages(false);
                }}
                className={`p-2 rounded-lg transition-all ${showNotes ? 'bg-primary text-secondary' : 'text-gray-400 hover:bg-surface'}`}
                title="Notes"
              >
                <MessageSquare size={20} />
              </button>
              <button 
                onClick={handleAddHighlight}
                className="p-2 text-gray-400 hover:bg-surface rounded-lg transition-all"
                title="Quick Highlight Page"
              >
                <Highlighter size={20} />
              </button>
              <button 
                onClick={handleSavePage}
                className={`p-2 rounded-lg transition-all ${isPageSaved ? 'text-primary' : 'text-gray-400 hover:bg-surface'}`}
                title="Save this Page"
              >
                <Save size={20} />
              </button>
            </>
          )}
          
          <div className="flex items-center bg-surface rounded-lg border border-surface-border ml-2">
            <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))} className="h-10 w-10 flex items-center justify-center text-text-main hover:bg-surface-light rounded-l-lg">-</button>
            <span className="text-text-main text-xs font-bold w-12 text-center">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScale(prev => Math.min(3, prev + 0.2))} className="h-10 w-10 flex items-center justify-center text-text-main hover:bg-surface-light rounded-r-lg">+</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2 text-text-main disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-text-main font-bold">
            Page {currentPage} of {numPages}
          </span>
          <button 
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 text-text-main disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="sm:hidden p-2 text-text-main hover:bg-surface rounded-lg"
            title="Full Screen"
          >
            <Maximize2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
