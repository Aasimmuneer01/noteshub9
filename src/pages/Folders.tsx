import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, deleteDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Folder, Resource } from '../types';
import { Folder as FolderIcon, Plus, Trash2, BookOpen, Loader2, FolderPlus, MoreVertical, X, Check } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Folders() {
  const { user, userData, isPremium, loading: authLoading } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchFolders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users', user.uid, 'folders'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
        setFolders(fetched);
      } catch (err) {
        console.error("Error fetching folders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [user]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName.trim()) return;
    setIsCreating(true);
    try {
      const folderRef = doc(collection(db, 'users', user.uid, 'folders'));
      const folderData = {
        userId: user.uid,
        name: newFolderName.trim(),
        resourceIds: [],
        createdAt: serverTimestamp()
      };
      await setDoc(folderRef, folderData);
      setFolders(prev => [{ id: folderRef.id, ...folderData } as Folder, ...prev]);
      setNewFolderName('');
      setShowCreate(false);
    } catch (err) {
      console.error("Error creating folder:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this folder? Resources inside won't be deleted.")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'folders', id));
      setFolders(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-white">Loading Auth...</div>;
  if (!user || !isPremium) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b border-surface pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans text-text-main flex items-center gap-3">
            <FolderIcon className="text-primary w-8 h-8" fill="currentColor" />
            Study Folders
          </h1>
          <p className="text-gray-400 text-sm mt-1">Organize your resources into custom collections</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-secondary font-bold rounded-xl hover:brightness-110 transition-all shadow-lg"
        >
          <FolderPlus size={18} />
          <span>New Folder</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-secondary rounded-3xl">
          <FolderIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">No folders created</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
            Create folders like "Physics", "Exam Prep", or "Revision" to stay organized.
          </p>
          <button 
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-block px-6 py-2 bg-surface text-text-main font-bold rounded-xl border border-secondary hover:bg-secondary transition-all"
          >
            Create Your First Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <motion.div 
              layout
              key={folder.id}
              className="bg-surface border border-secondary rounded-3xl p-6 hover:border-primary/50 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                  <FolderIcon size={24} fill="currentColor" />
                </div>
                <button 
                  onClick={() => deleteFolder(folder.id)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{folder.name}</h3>
              <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">
                {folder.resourceIds?.length || 0} Resources
              </p>
              
              <Link 
                to={`/resources?folder=${folder.id}`}
                className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-secondary text-gray-300 hover:text-white rounded-xl text-sm font-bold border border-surface transition-all"
              >
                Open Folder
                <BookOpen size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.form 
              onSubmit={handleCreateFolder}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-secondary p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Create Folder</h3>
                <p className="text-gray-400 text-sm">Organize your study journey</p>
              </div>
              
              <input 
                autoFocus
                type="text"
                placeholder="Folder Name (e.g. Physics)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-background-main border border-secondary rounded-xl py-3 px-4 text-white focus:border-primary outline-none transition-all"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 bg-secondary text-text-main font-bold rounded-xl text-sm border border-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating || !newFolderName.trim()}
                  className="flex-1 py-3 bg-primary text-secondary font-bold rounded-xl text-sm hover:brightness-110 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
