import { useEffect, useState, useMemo, MouseEvent } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Resource } from '../types';
import { FileText, Download, Eye, Search, Filter, Lock, Crown, Bookmark, FolderPlus, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/utils';
import { Folder } from '../types';

const SUBJECTS = ['All', 'Maths', 'English', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Civics', 'Computer', 'Islamic Studies', 'Urdu'];

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { userData, user, isPremium } = useAuth();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

  const currentSubject = searchParams.get('subject') || 'All';

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        setResources(fetchedResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPremiumData = async () => {
      if (!user || !isPremium) return;
      try {
        const foldersSnap = await getDocs(collection(db, 'users', user.uid, 'folders'));
        setFolders(foldersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)));
        
        const bookmarksSnap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
        setUserBookmarks(bookmarksSnap.docs.map(doc => doc.data().resourceId));
      } catch (err) {
        console.error("Error fetching premium data in resources:", err);
      }
    };

    fetchResources();
    fetchPremiumData();
  }, [user, isPremium]);

  const toggleBookmark = async (resource: Resource) => {
    if (!user || !isPremium) return;
    try {
      const isBookmarked = userBookmarks.includes(resource.id);
      if (isBookmarked) {
        await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', resource.id));
        setUserBookmarks(prev => prev.filter(id => id !== resource.id));
      } else {
        await setDoc(doc(db, 'users', user.uid, 'bookmarks', resource.id), {
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceThumbnail: resource.thumbnailUrl || '',
          createdAt: serverTimestamp()
        });
        setUserBookmarks(prev => [...prev, resource.id]);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const addToFolder = async (folderId: string, resource: Resource) => {
    if (!user || !isPremium) return;
    try {
      const folderRef = doc(db, 'users', user.uid, 'folders', folderId);
      const folder = folders.find(f => f.id === folderId);
      if (folder?.resourceIds.includes(resource.id)) return;
      
      await updateDoc(folderRef, {
        resourceIds: arrayUnion(resource.id)
      });
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, resourceIds: [...f.resourceIds, resource.id] } : f));
      setActiveFolderMenu(null);
    } catch (err) {
      console.error("Error adding to folder:", err);
    }
  };

  const handleView = (e: MouseEvent, resource: Resource) => {
    e.preventDefault();
    const viewedKey = `viewed_${resource.id}`;
    const lastViewed = localStorage.getItem(viewedKey);
    const now = Date.now();
    
    // Navigate immediately for better UX
    navigate(`/viewer/${resource.id}`);

    if (auth.currentUser && (!lastViewed || now - parseInt(lastViewed) > 24 * 60 * 60 * 1000)) {
      const path = `resources/${resource.id}`;
      updateDoc(doc(db, 'resources', resource.id), {
        viewCount: increment(1)
      }).then(() => {
        localStorage.setItem(viewedKey, now.toString());
      }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, path);
      });
    }
  };

  const handleDownload = (e: MouseEvent, resource: Resource) => {
    e.preventDefault();
    if (!isPremium) return;
    
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

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const subj = currentSubject.toLowerCase();
      const matchesSubject = currentSubject === 'All' || 
        (resource.category && resource.category.toLowerCase().includes(subj)) ||
        (resource.subject && resource.subject.toLowerCase().includes(subj)) ||
        (resource.title && resource.title.toLowerCase().includes(subj));
        
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSubject && matchesSearch;
    });
  }, [resources, currentSubject, searchQuery]);

  const handleSubjectClick = (subject: string) => {
    if (subject === 'All') {
      searchParams.delete('subject');
    } else {
      searchParams.set('subject', subject);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight text-text-main uppercase">Study Resources</h1>
        <p className="text-gray-400">Browse and download educational materials.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Filters */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-surface p-4 rounded-xl border border-secondary shadow-lg">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background-main border border-secondary p-2 pl-9 rounded-lg text-text-main text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <h3 className="text-text-main font-bold mb-3 uppercase tracking-wide text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" /> Subjects
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectClick(subject)}
                    className={`px-3 py-2 text-sm md:text-md rounded-lg font-medium text-left transition-colors ${
                      currentSubject === subject 
                        ? 'bg-primary text-secondary font-bold shadow-[0_2px_0_0_#0ea5e9]' 
                        : 'text-gray-400 hover:bg-secondary hover:text-white'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl text-center border border-secondary shadow-lg">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-300 mb-2">No resources found</h2>
              <p className="text-gray-500">Try selecting a different subject or adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.map((resource, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 10) * 0.05 }}
                  key={resource.id} 
                  className="bg-surface rounded-2xl border border-secondary shadow-lg overflow-hidden flex flex-col hover:-translate-y-2 transition-transform duration-300"
                >
                  {resource.thumbnailUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img src={resource.thumbnailUrl} alt={resource.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-secondary flex items-center justify-center border-b border-surface">
                       <FileText className="w-16 h-16 text-primary" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary uppercase rounded">
                          {resource.category || 'General'}
                        </span>
                        <span className="text-xs font-bold text-gray-500 bg-secondary px-2 py-1 rounded">
                          {resource.classLevel}
                        </span>
                      </div>
                      
                      {isPremium && (
                        <div className="flex gap-1 relative">
                          <button 
                            onClick={() => toggleBookmark(resource)}
                            className={`p-1.5 rounded-lg transition-all ${userBookmarks.includes(resource.id) ? 'bg-primary text-secondary' : 'bg-secondary text-gray-400 hover:text-white'}`}
                          >
                            <Bookmark size={14} fill={userBookmarks.includes(resource.id) ? "currentColor" : "none"} />
                          </button>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setActiveFolderMenu(activeFolderMenu === resource.id ? null : resource.id)}
                              className={`p-1.5 rounded-lg bg-secondary text-gray-400 hover:text-white transition-all ${activeFolderMenu === resource.id ? 'bg-primary/20 text-primary' : ''}`}
                            >
                              <FolderPlus size={14} />
                            </button>

                            <AnimatePresence>
                              {activeFolderMenu === resource.id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-surface border border-secondary rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                                >
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest p-2 mb-1 border-b border-secondary">Add to Folder</p>
                                  <div className="max-h-40 overflow-auto py-1">
                                    {folders.length === 0 ? (
                                      <Link to="/folders" className="block p-2 text-xs text-primary hover:underline">Create a folder first</Link>
                                    ) : (
                                      folders.map(folder => (
                                        <button
                                          key={folder.id}
                                          onClick={() => addToFolder(folder.id, resource)}
                                          disabled={folder.resourceIds.includes(resource.id)}
                                          className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                            folder.resourceIds.includes(resource.id) 
                                              ? 'text-gray-600 cursor-default' 
                                              : 'text-gray-300 hover:bg-secondary hover:text-white'
                                          }`}
                                        >
                                          {folder.name}
                                          {folder.resourceIds.includes(resource.id) && <CheckCircle2 size={12} className="text-primary" />}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2 line-clamp-2 leading-tight">{resource.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{resource.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary">
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {resource.viewCount || 0}</span>
                        <span className="flex items-center gap-1"><Download className="w-4 h-4" /> {resource.downloadCount || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleView(e, resource)}
                          className="px-4 py-2 bg-secondary text-primary rounded-lg font-bold text-sm shadow-[0_2px_0_0_theme(colors.surface)] hover:shadow-none hover:translate-y-[2px] transition-all uppercase flex items-center gap-2"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button 
                          onClick={(e) => {
                            if (isPremium) {
                              handleDownload(e, resource);
                            } else {
                              e.preventDefault();
                              alert("Ask the admin to give you the premium access to download any resources");
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all uppercase flex items-center gap-2 ${
                            isPremium 
                              ? 'bg-primary text-secondary shadow-[0_2px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[2px]' 
                              : 'bg-secondary text-gray-500 border border-surface hover:text-gray-300'
                          }`}
                        >
                          {isPremium ? <Download size={16} /> : <Lock size={16} />}
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
