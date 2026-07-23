import { useState } from 'react';
import { Warning } from '../types';
import TermsContent from './TermsContent';

interface WarningModalProps {
  warnings: Warning[];
  onUnderstand: () => void;
}

export default function WarningModal({ warnings, onUnderstand }: WarningModalProps) {
  const latestWarning = warnings[warnings.length - 1];
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-secondary p-8 rounded-2xl w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-red-500 flex items-center gap-2">
          ⚠️ Warning
        </h2>
        <div className="space-y-4">
          <div>
            <p className="font-bold text-white">Reason:</p>
            <p className="text-gray-300">{latestWarning.reason}</p>
          </div>
          <p className="text-gray-400 text-sm">
            You have violated one or more Terms of Use. Please correct your behavior immediately. Repeated violations may result in temporary or permanent suspension of your account.
          </p>
        </div>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={onUnderstand}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90"
          >
            I Understand
          </button>
          <button 
            onClick={() => setShowTerms(true)}
            className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/80"
          >
            View Terms of Use
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-secondary p-8 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 bg-secondary text-white p-2 rounded-full hover:bg-secondary/80"
            >
              Close
            </button>
            <h2 className="text-2xl font-bold mb-4 text-white">Terms of Use</h2>
            <TermsContent />
          </div>
        </div>
      )}
    </div>
  );
}
