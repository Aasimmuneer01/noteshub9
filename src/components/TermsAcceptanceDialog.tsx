import { useState } from 'react';
import TermsContent from './TermsContent';

interface TermsAcceptanceDialogProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsAcceptanceDialog({ onAccept, onDecline }: TermsAcceptanceDialogProps) {
  const [showTerms, setShowTerms] = useState(false);
  console.log("DEBUG: TermsAcceptanceDialog rendering");
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-main border border-secondary p-8 rounded-2xl w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Terms of Use Update</h2>
        <p className="mb-6 text-text-main">
          Please review and <button onClick={() => setShowTerms(true)} className="text-primary underline font-bold">accept our updated Terms of Use</button> to continue using EduPlatform.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onAccept}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90"
          >
            I Agree
          </button>
          <button 
            onClick={onDecline}
            className="flex-1 bg-surface text-text-main py-3 rounded-xl font-bold hover:bg-surface/80"
          >
            Decline
          </button>
        </div>
      </div>
      {showTerms && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-background-main border border-secondary p-8 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-text-main">Terms of Use</h2>
            <TermsContent />
            <button 
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full bg-surface text-text-main py-3 rounded-xl font-bold hover:bg-surface/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
