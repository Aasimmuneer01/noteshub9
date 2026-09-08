import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginGateProps {
  onAuth: () => void;
  onLeave: () => void;
}

export default function LoginGate({ onAuth, onLeave }: LoginGateProps) {
  return (
    <div className="min-h-[80vh] bg-background-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface border border-surface-border rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/20">
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-main font-sans">
            🔐 Login or Sign Up Required
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Please create an account or sign in to continue using this feature.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onAuth}
            className="w-full py-3 px-4 bg-primary text-secondary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign Up / Sign In
          </button>
          
          <button
            onClick={onLeave}
            className="w-full py-3 px-4 bg-surface-border text-text-main font-semibold rounded-xl hover:bg-surface-border/80 transition-all text-sm cursor-pointer"
          >
            Leave Website
          </button>
        </div>
      </motion.div>
    </div>
  );
}
