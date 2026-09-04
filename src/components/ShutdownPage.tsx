
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail, ShieldAlert, Wrench, LogOut, LogIn, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

interface ShutdownPageProps {
  status: 'Temporary' | 'Permanent' | 'Maintenance' | string;
  title: string;
  description: string;
  returnDate?: string;
  contactEmail?: string;
  restoreTime?: any;
}

export default function ShutdownPage({ status, title, description, returnDate, contactEmail, restoreTime }: ShutdownPageProps) {
  const { logout, user } = useAuth();
  const isMaintenance = status === 'Maintenance';
  const defaultTitle = isMaintenance ? 'Website Under Maintenance' : 'Website Unavailable';
  const defaultDescription = isMaintenance ? 'We are currently performing maintenance.\nPlease check back later.' : 'This website is currently undergoing maintenance. Please check back later.';

  const Icon = isMaintenance ? Wrench : (status === 'Permanent' ? ShieldAlert : AlertTriangle);
  const iconColor = isMaintenance ? 'text-blue-400' : (status === 'Permanent' ? 'text-red-500' : 'text-yellow-500');
  const bgColor = isMaintenance ? 'bg-blue-500/10' : (status === 'Permanent' ? 'bg-red-500/10' : 'bg-yellow-500/10');

  const [countdown, setCountdown] = useState<string>('');
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const restoreMs = restoreTime?.toDate ? restoreTime.toDate().getTime() : (returnDate ? new Date(returnDate).getTime() : 0);
      if (!restoreMs) return;

      const diff = restoreMs - now;
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setCountdown(timeStr);
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [restoreTime, returnDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 text-gray-100 p-6 text-center overflow-y-auto">
      <div className="max-w-md w-full space-y-8 my-8">
        <div className={`w-24 h-24 mx-auto rounded-3xl ${bgColor} flex items-center justify-center border border-white/5`}>
          <Icon className={`w-12 h-12 ${iconColor}`} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold whitespace-pre-line tracking-tight text-white">
            {title || defaultTitle}
          </h1>
          <p className="text-gray-400 whitespace-pre-line text-base sm:text-lg">
            {description || defaultDescription}
          </p>
        </div>
        
        <div className="bg-gray-900/90 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-gray-800 space-y-6 text-left shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
              <Icon className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Current Status</p>
              <p className="font-bold text-gray-100 text-lg">
                {isMaintenance ? 'Maintenance Mode' : `${status} Shutdown`}
              </p>
            </div>
          </div>
          
          {(returnDate || restoreTime) && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
              <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
                <Clock className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Expected Return</p>
                <p className="font-bold text-gray-100 text-lg">
                  {restoreTime?.toDate ? restoreTime.toDate().toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : (returnDate ? new Date(returnDate).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'To be announced')}
                </p>
                {countdown && (
                  <p className="text-sm font-mono font-bold text-yellow-400 mt-1">
                    Website will be back in {countdown}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {contactEmail && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
              <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
                <Mail className="w-6 h-6 text-gray-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Support Contact</p>
                <a href={`mailto:${contactEmail}`} className="font-bold text-blue-400 text-lg truncate block hover:underline">
                  {contactEmail}
                </a>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-800 space-y-3">
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (err) {
                    console.error("Logout failed:", err);
                  }
                }}
                className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sign Out / Switch Account
              </button>
            ) : (
              <div>
                {!showLogin ? (
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="w-full py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In / Admin Login
                  </button>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-300">Sign In</span>
                      <button type="button" onClick={() => setShowLogin(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                    </div>
                    {loginError && (
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {loginLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

