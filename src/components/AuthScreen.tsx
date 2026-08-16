import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { login, signup, continueWithGoogle, forgotPassword, bannedMessage, clearBannedMessage } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  if (bannedMessage) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
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
        if (!displayName.trim()) throw new Error("Full Name is required");
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await continueWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      switch (err.code) {
        case 'auth/unauthorized-domain':
          setError("This domain is not authorized for Google Sign-In. Please add it in the Firebase Console.");
          break;
        case 'auth/popup-blocked':
          setError("The popup was blocked by your browser. Please allow popups for this site.");
          break;
        case 'auth/popup-closed-by-user':
          // Silently ignore as the user explicitly closed it
          break;
        case 'auth/cancelled-popup-request':
          // Silently ignore as the user cancelled the request
          break;
        case 'auth/account-exists-with-different-credential':
          setError("An account already exists with the same email address but different sign-in credentials (e.g., password). Please sign in using your existing method.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your internet connection and try again.");
          break;
        case 'auth/operation-not-supported-in-this-environment':
          setError("Google Sign-In is not supported in this environment.");
          break;
        case 'auth/configuration-not-found':
          setError("Google Sign-In provider is not enabled in Firebase.");
          break;
        default:
          setError(`Google Sign-In error (${err.code}): ${err.message}`);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Deep atmospheric lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>

          {/* Logo / Icon */}
          <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
            <img src="/favicon.png" alt="NotesHub9 Logo" className="w-8 h-8 object-contain" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium tracking-wide text-white mb-1">
              {mode === 'login' ? 'Welcome' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-[#8B98B2] text-[13px]">
              {mode === 'login' ? 'Please enter your details to sign in.' : mode === 'signup' ? 'Please enter your details to sign up.' : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-between bg-[#1A2235]/60 hover:bg-[#1A2235] border border-white/5 rounded-2xl p-3.5 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[14px] text-[#8B98B2] group-hover:text-white transition-colors">Continue with Google</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B98B2] group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => {}}
                  className="w-full flex items-center justify-between bg-[#1A2235]/60 hover:bg-[#1A2235] border border-white/5 rounded-2xl p-3.5 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    <span className="text-[14px] text-[#8B98B2] group-hover:text-white transition-colors">Continue with GitHub</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B98B2] group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10"></div>
                <span className="text-[11px] text-[#4B5563] font-medium uppercase tracking-widest">OR</span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10"></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex items-center bg-[#1A2235]/80 border border-white/5 rounded-2xl p-2 pl-5 focus-within:border-cyan-500/50 transition-colors">
                <div className="flex-1 flex flex-col justify-center py-1">
                  <label className="text-[10px] text-[#8B98B2] font-medium tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-transparent text-white text-[15px] outline-none w-full mt-0.5 placeholder-[#4B5563]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center bg-[#1A2235]/80 border border-white/5 rounded-2xl p-2 pl-5 focus-within:border-cyan-500/50 transition-colors">
              <div className="flex-1 flex flex-col justify-center py-1">
                <label className="text-[10px] text-[#8B98B2] font-medium tracking-wider">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-white text-[15px] outline-none w-full mt-0.5 placeholder-[#4B5563]"
                />
              </div>
              {mode === 'forgot' && (
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#06b6d4] to-[#38bdf8] flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 ml-2"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {mode !== 'forgot' && (
              <div className="flex items-center bg-[#1A2235]/80 border border-white/5 rounded-2xl p-2 pl-5 focus-within:border-cyan-500/50 transition-colors">
                <div className="flex-1 flex flex-col justify-center py-1">
                  <label className="text-[10px] text-[#8B98B2] font-medium tracking-wider">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-white text-[15px] outline-none w-full mt-0.5 placeholder-[#4B5563]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#06b6d4] to-[#38bdf8] flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 ml-2"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1 px-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#38bdf8] border-[#38bdf8]' : 'border border-[#4B5563] group-hover:border-[#8B98B2]'}`}>
                    {rememberMe && <Check className="w-3 h-3 text-[#0B132B]" strokeWidth={3} />}
                  </div>
                  <span className="text-[13px] text-[#8B98B2]">Remember me</span>
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                </label>
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-[13px] text-[#8B98B2] hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>



          <div className="mt-8 text-center text-[13px] text-[#8B98B2]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-[#38bdf8] hover:text-white transition-colors ml-1 font-medium underline underline-offset-4 decoration-[#38bdf8]/30">Create Account</button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-[#38bdf8] hover:text-white transition-colors ml-1 font-medium underline underline-offset-4 decoration-[#38bdf8]/30">Sign in</button>
              </p>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
