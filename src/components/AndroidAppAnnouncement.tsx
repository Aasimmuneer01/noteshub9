import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone } from 'lucide-react';

export function AndroidAppAnnouncement() {
  const [showPopup, setShowPopup] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('noteshub9_android_app_announcement_seen');
    if (!seen) {
      setShowPopup(true);
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleClosePopup = () => {
    localStorage.setItem('noteshub9_android_app_announcement_seen', 'true');
    setShowPopup(false);
    setShowBanner(true);
  };

  return (
    <>
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface border border-surface-border p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col items-center justify-center text-center mx-auto my-auto"
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded-full hover:bg-surface-light transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone size={24} />
              </div>

              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-xl md:text-2xl font-bold text-text-main mb-3">
                Good News! The NotesHub9 Android App is Coming Soon! 📱
              </h3>
              <p className="text-text-muted text-sm md:text-base leading-relaxed mb-6">
                We're working on a dedicated Android app to make accessing NotesHub9 resources and features even easier on your phone.<br/><br/>
                Stay tuned — the app is coming soon! 🚀
              </p>

              <button
                onClick={handleClosePopup}
                className="w-full py-3 bg-primary text-secondary rounded-xl font-bold hover:opacity-90 transition-all shadow-lg cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showBanner && (
        <div className="bg-gradient-to-r from-primary/10 via-surface to-primary/10 border-b border-surface-border text-text-main px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 text-center">
          <Smartphone size={16} className="text-primary shrink-0" />
          <span>📱 Good news! The NotesHub9 Android App is coming soon! 🚀</span>
        </div>
      )}
    </>
  );
}
