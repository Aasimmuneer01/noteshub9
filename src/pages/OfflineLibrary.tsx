import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Bookmark, Resource } from '../types';
import { Download, Trash2, BookOpen, Loader2, SignalHigh, WifiOff, FileText, Bookmark as BookmarkIcon } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function OfflineLibrary() {
  const { user, userData, isPremium, loading: authLoading } = useAuth();
  const [offlineResources, setOfflineResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from IndexedDB or Cache API
    // For this simulation, we'll fetch resources that the user has "downloaded"
    // or we'll just show the history as "Offline available"
    const fetchOffline = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Mocking offline library from bookmarks for now
        const q = query(collection(db, 'users', user.uid, 'bookmarks'));
        const snap = await getDocs(q);
        // In a real app, we'd check a local storage flag
        const offlineData = snap.docs.map(doc => ({ id: doc.data().resourceId, ...doc.data() } as any));
        setOfflineResources(offlineData);
      } catch (err) {
        console.error("Error fetching offline:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffline();
  }, [user]);

  if (authLoading) return <div className="p-8 text-center text-white">Loading Auth...</div>;
  if (!user || !isPremium) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b border-surface pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans text-text-main flex items-center gap-3">
            <WifiOff className="text-primary w-8 h-8" />
            Offline Library
          </h1>
          <p className="text-gray-400 text-sm mt-1">Resources saved for offline viewing</p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center gap-4">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/30">
          <SignalHigh size={20} />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Offline Mode Enabled</p>
          <p className="text-gray-400 text-xs">Premium users can access these files even without an active internet connection.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : offlineResources.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-secondary rounded-3xl">
          <Download className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">No offline files</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
            Resources you download or mark for offline will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offlineResources.map((res) => (
            <motion.div 
              layout
              key={res.id}
              className="bg-surface border border-secondary rounded-3xl p-5 hover:border-primary/50 transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                <FileText size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm truncate">{res.resourceTitle || res.title}</h3>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Saved Offline</p>
              </div>
              <Link 
                to={`/viewer/${res.id || res.resourceId}`}
                className="p-3 bg-secondary text-primary rounded-xl border border-surface hover:bg-primary hover:text-secondary transition-all"
              >
                <BookOpen size={18} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
