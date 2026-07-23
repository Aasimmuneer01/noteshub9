import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Bookmark, Resource } from '../types';
import { Bookmark as BookmarkIcon, Trash2, ExternalLink, BookOpen, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Bookmarks() {
  const { user, userData, isPremium, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users', user.uid, 'bookmarks'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
        setBookmarks(fetched);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', id));
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error removing bookmark:", err);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-white">Loading Auth...</div>;
  if (!user || !isPremium) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b border-surface pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans text-text-main flex items-center gap-3">
            <BookmarkIcon className="text-primary w-8 h-8" fill="currentColor" />
            My Bookmarks
          </h1>
          <p className="text-gray-400 text-sm mt-1">Saved resources for quick access</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-secondary rounded-3xl">
          <BookmarkIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">No bookmarks yet</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
            Start bookmarking your favorite study materials to see them here.
          </p>
          <Link to="/resources" className="mt-6 inline-block px-6 py-2 bg-primary text-secondary font-bold rounded-xl hover:brightness-110 transition-all">
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <motion.div 
              layout
              key={bookmark.id}
              className="bg-surface border border-secondary rounded-3xl overflow-hidden group hover:border-primary/50 transition-all shadow-xl"
            >
              <div className="h-40 bg-secondary relative overflow-hidden">
                {bookmark.resourceThumbnail ? (
                  <img src={bookmark.resourceThumbnail} alt={bookmark.resourceTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <BookOpen size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button 
                  onClick={() => removeBookmark(bookmark.id)}
                  className="absolute top-3 right-3 p-2 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all backdrop-blur-sm"
                  title="Remove Bookmark"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <h3 className="text-white font-bold line-clamp-2 min-h-[3rem]">{bookmark.resourceTitle}</h3>
                <div className="flex gap-2">
                  <Link 
                    to={`/viewer/${bookmark.resourceId}`}
                    className="flex-1 py-2 bg-primary text-secondary text-center font-bold rounded-xl text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} />
                    Read Now
                  </Link>
                  <Link 
                    to={`/resources`} // In a real app, link to resource details
                    className="p-2 bg-secondary text-gray-400 hover:text-white border border-surface rounded-xl transition-all"
                    title="View Details"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
