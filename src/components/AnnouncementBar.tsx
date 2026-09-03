import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2 } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Fetch active announcements
    const q = query(collection(db, 'announcements'), where('enabled', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort by priority (Maintenance > Important > Normal) and then by creation date
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const maintenance = docs.find(d => d.type === 'Maintenance');
        const important = docs.find(d => d.type === 'Important');
        const normal = docs.find(d => d.type === 'Normal');
        
        const activeAnn = maintenance || important || normal || docs[0];
        setAnnouncement(activeAnn);
        setDismissed(false); // Reset dismissal if a new announcement comes in
      } else {
        setAnnouncement(null);
      }
    }, (error) => {
      console.warn("Announcement listener error", error);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (announcement?.type === 'Maintenance' && announcement?.maintenanceDate) {
      const interval = setInterval(() => {
        const target = new Date(announcement.maintenanceDate).getTime();
        const now = new Date().getTime();
        const distance = target - now;

        if (distance <= 0) {
          setTimeLeft('Maintenance is starting now...');
          clearInterval(interval);
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(`Maintenance begins in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [announcement]);

  if (!announcement || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-[#1a1a2e] border-b border-[#2d2d44] w-full overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between relative">
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-8">
            <Volume2 size={16} className="text-red-500 shrink-0" />
            <div className="flex-1 overflow-hidden relative group h-5 flex items-center">
              <div className="text-xs md:text-sm font-semibold text-red-500 whitespace-nowrap overflow-hidden text-ellipsis md:animate-none animate-[marquee_15s_linear_infinite] motion-reduce:animate-none md:w-auto w-[200%] inline-block">
                {announcement.text}
                {announcement.type === 'Maintenance' && (
                  <span className="ml-2 font-mono bg-red-500/20 px-2 py-0.5 rounded text-red-400">
                    {timeLeft}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setDismissed(true)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 shrink-0 z-10"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
