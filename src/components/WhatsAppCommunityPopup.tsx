import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/DImncFL88tM821VQHUnCLh';
const STORAGE_KEY_PREFIX = 'noteshub9_whatsapp_community_dismissed';

export default function WhatsAppCommunityPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [customAnnouncement, setCustomAnnouncement] = useState<any>(null);
  const [isCommunityDisabled, setIsCommunityDisabled] = useState(false);

  useEffect(() => {
    // Listen to Firestore announcements to check if admin configured a Community announcement or disabled it
    const q = query(collection(db, 'announcements'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let communityAnn: any = null;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.type === 'Community' || data.type === 'WhatsApp') {
            if (data.enabled === false) {
              setIsCommunityDisabled(true);
            } else {
              communityAnn = { id: doc.id, ...data };
              setIsCommunityDisabled(false);
            }
          }
        });
        if (communityAnn) {
          setCustomAnnouncement(communityAnn);
        }
      },
      (err) => {
        console.warn('Could not fetch announcements from Firestore:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    if (isCommunityDisabled) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed previously for this user or browser
    const userDismissed = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${user.uid}`);
    const globalDismissed = localStorage.getItem(STORAGE_KEY_PREFIX);

    if (!userDismissed && !globalDismissed) {
      // Delay slightly for smooth UX so it doesn't abruptly flash on mount
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [user, isCommunityDisabled]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_${user.uid}`, 'true');
    }
    localStorage.setItem(STORAGE_KEY_PREFIX, 'true');
    setIsOpen(false);
  };

  const handleJoin = () => {
    const targetUrl = customAnnouncement?.link || WHATSAPP_COMMUNITY_URL;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    handleDismiss();
  };

  if (!isOpen || !user || isCommunityDisabled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="whatsapp-community-modal-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-modal-title"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-surface border border-surface-border p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative text-center mx-auto my-auto overflow-hidden"
          >
            {/* Top close button */}
            <button
              id="whatsapp-modal-close-btn"
              onClick={handleDismiss}
              aria-label="Close popup"
              className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1.5 rounded-full hover:bg-surface-light transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header Icons & Badge */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <MessageCircle size={26} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                <Smartphone size={26} />
              </div>
            </div>

            {/* Title */}
            <h3 
              id="whatsapp-modal-title"
              className="text-xl sm:text-2xl font-bold text-text-main mb-3 leading-snug"
            >
              {customAnnouncement?.title || 'NotesHub9 Android App — Coming Soon! 📱'}
            </h3>

            {/* Message Body */}
            <div className="text-text-muted text-sm sm:text-base leading-relaxed mb-6 space-y-2">
              <p className="font-semibold text-text-main">
                {customAnnouncement?.subtitle || "We're working on the NotesHub9 Android app! 🚀"}
              </p>
              <p>
                {customAnnouncement?.text ||
                  'Join our WhatsApp Community to get updates about the Android app launch, important announcements, and other NotesHub9 news.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                id="whatsapp-modal-join-btn"
                onClick={handleJoin}
                className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer order-1"
              >
                <MessageCircle size={18} />
                <span>Join WhatsApp Community</span>
                <ArrowRight size={16} />
              </button>

              <button
                id="whatsapp-modal-later-btn"
                onClick={handleDismiss}
                className="w-full sm:w-auto sm:px-5 py-3 text-text-muted hover:text-text-main hover:bg-surface-light border border-surface-border rounded-xl font-medium transition-all cursor-pointer order-2"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
