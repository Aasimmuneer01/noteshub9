import React from 'react';
import { X, Sparkles } from 'lucide-react';

export const NewFeaturePopup = ({ version, onClose }: { version: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-main border border-secondary p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X /></button>
        <div className="text-primary mb-4"><Sparkles size={40} /></div>
        <h2 className="text-2xl font-bold mb-4 text-text-main">Welcome back!</h2>
        <p className="mb-6 text-text-main">We've updated some features to improve your experience.</p>
        <button onClick={onClose} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Close</button>
      </div>
    </div>
  );
};
