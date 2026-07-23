import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, RefreshCw, LogOut, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerificationScreen() {
  const { user, logout, resendVerification, verifyOTP } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      console.error("Resend err", err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isValid = await verifyOTP(otp);
      if (isValid) {
        setSuccess(true);
      } else {
        setError("Invalid or expired code. Please try again.");
      }
    } catch (err) {
      console.error("Verify err", err);
      setError("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-surface border border-primary/20 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/30">
          {success ? <ShieldCheck className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-sans text-text-main">
            {success ? 'Account Verified!' : 'Verify Your Account'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {success 
              ? 'Your account has been successfully verified. You can now access all features.'
              : 'Please enter the 6-digit code sent to your email to continue.'}
          </p>
          <p className="text-xs text-gray-400 pt-1">
            Signed in as: <span className="text-primary font-mono">{user?.email}</span>
          </p>
        </div>

        {!success && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-background-main border border-secondary rounded-xl py-3 px-4 text-center text-2xl font-mono tracking-[0.5em] text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-sm"
              />
              {error && (
                <div className="text-red-400 text-xs flex items-center justify-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-primary text-secondary font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              <span>{loading ? 'Verifying...' : 'Verify Account'}</span>
            </button>
          </form>
        )}

        {sent && !success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs flex items-center justify-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Code sent! Please check your inbox (and spam).</span>
          </div>
        )}

        {!success && (
          <div className="space-y-3 pt-2">
            <button 
              onClick={handleResend}
              disabled={loading}
              className="w-full py-2 bg-transparent text-gray-400 hover:text-text-main transition-all text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Sending...' : 'Didn\'t receive a code? Resend'}</span>
            </button>
          </div>
        )}

        <div className="border-t border-secondary pt-4">
          <button 
            onClick={logout}
            className="text-xs text-red-400 hover:underline inline-flex items-center gap-1.5 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{success ? 'Close and continue' : 'Sign out and use another account'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
