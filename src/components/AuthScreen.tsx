import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { login, signup, forgotPassword, bannedMessage, clearBannedMessage } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (bannedMessage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111] border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-white">Access Denied</h2>
          <p className="text-red-400 font-medium leading-relaxed">{bannedMessage}</p>
          <button 
            onClick={clearBannedMessage}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        if (!displayName.trim()) throw new Error("Display Name is required");
        await signup(email, password, displayName);
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setSuccessMsg("Password reset link sent to your email!");
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("You are not registered on this website sign-up before sign in");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-main flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow styling */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-surface border border-secondary rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto border border-primary/20 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-text-main">
            {mode === 'login' ? 'Sign In to EduPlatform' : mode === 'signup' ? 'Create Your Account' : 'Reset Password'}
          </h1>
          <p className="text-slate-600 text-sm">
            {mode === 'login' ? 'Enter your email and password to access study notes.' : mode === 'signup' ? 'Join thousands of students learning smarter.' : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-700 rounded-xl text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3 text-gray-500" />
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Student Name"
                  className="w-full bg-background-main border border-secondary rounded-xl pl-11 pr-4 py-2.5 text-text-main placeholder-gray-500 focus:outline-none focus:border-primary text-sm transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-gray-500" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-background-main border border-secondary rounded-xl pl-11 pr-4 py-2.5 text-text-main placeholder-gray-500 focus:outline-none focus:border-primary text-sm transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-gray-500" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background-main border border-secondary rounded-xl pl-11 pr-4 py-2.5 text-text-main placeholder-gray-500 focus:outline-none focus:border-primary text-sm transition-colors"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-secondary font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-sm"
          >
            <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="border-t border-secondary pt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-primary font-bold hover:underline">Sign up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline">Sign in</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
