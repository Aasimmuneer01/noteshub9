import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onAcknowledge: () => void;
}

export default function PremiumNotificationPopup({ onAcknowledge }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 border border-primary/20 text-center"
      >
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-text-main mb-3">
          You've Got 1 Year of Free Premium!
        </h2>
        <p className="text-text-muted mb-6">
          Congratulations! You have been given 1 year of free Premium membership on NotesHub9.<br/><br/>
          Enjoy all Premium features free of charge for the next year.
        </p>
        <button
          onClick={onAcknowledge}
          className="w-full py-3 bg-primary text-secondary rounded-lg font-bold hover:brightness-110 transition-all"
        >
          Awesome!
        </button>
      </motion.div>
    </div>
  );
}
