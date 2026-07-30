import React from 'react';
import { X, Star } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background-main border border-secondary p-6 rounded-2xl w-full max-w-sm shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Star className="fill-primary" /> Premium Features
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full"><X size={24} /></button>
        </div>
        <div className="space-y-4 text-text-main/80">
          <p>Upgrade to premium to unlock:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Unlimited chat history</li>
            <li>Advanced AI models</li>
            <li>Priority support</li>
            <li>Custom folders and organization</li>
          </ul>
          <button 
            onClick={onClose}
            className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-all mt-4"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
