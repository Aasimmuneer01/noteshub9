import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, Shield, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { logout, userData, user, isPremium } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (!isPremium || !userData?.premiumExpiry || userData.premiumPlan === 'Lifetime') {
      setRemainingTime('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = userData.premiumExpiry.toDate().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setRemainingTime('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) setRemainingTime(`${days}d ${hours}h left`);
      else if (hours > 0) setRemainingTime(`${hours}h ${minutes}m left`);
      else if (minutes > 0) setRemainingTime(`${minutes}m ${seconds}s left`);
      else setRemainingTime(`${seconds}s left`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isPremium, userData?.premiumExpiry, userData?.premiumPlan]);

  return (
    <nav className="bg-background-main border-b border-surface p-4 shadow-md z-50">
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-sans text-text-main tracking-tighter">EduPlatform</Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="px-4 py-2 bg-surface text-text-main rounded-lg font-bold shadow-[0_3px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_3px_0_0_#000] hover:shadow-none hover:translate-y-[3px] transition-all">Home</Link>
          <Link to="/resources" className="px-4 py-2 bg-primary text-slate-950 rounded-lg font-bold shadow-[0_3px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[3px] transition-all">Resources</Link>
          <Link to="/ai-assistant" className="px-4 py-2 bg-surface text-text-main rounded-lg font-bold hover:translate-y-[-2px] transition-all flex items-center gap-2"><Bot size={18}/> AI Assistant</Link>
          {isPremium && (
            <>
              <Link to="/bookmarks" className="px-4 py-2 bg-surface text-text-main rounded-lg font-bold hover:translate-y-[-2px] transition-all flex items-center gap-2">Bookmarks</Link>
              <Link to="/folders" className="px-4 py-2 bg-surface text-text-main rounded-lg font-bold hover:translate-y-[-2px] transition-all flex items-center gap-2">Folders</Link>
            </>
          )}
          {(userData?.role === 'admin' || userData?.role === 'superadmin' || user?.email === 'aasimmuneer349@gmail.com') && (
            <a href="/admin.html" className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2">
              <Shield size={18} />
              Admin
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Premium Badge */}
          {userData && (
            <div className="relative group">
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-help ${
                isPremium 
                  ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
                  : (userData.premiumStatus === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-surface text-gray-500 border-secondary')
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-primary animate-pulse' : (userData.premiumStatus === 'expired' ? 'bg-red-500' : 'bg-gray-500')}`} />
                {isPremium ? (userData.premiumPlan === 'Lifetime' ? 'Lifetime' : 'Premium') : (userData.premiumStatus === 'expired' ? 'Expired' : 'Free')}
                {remainingTime && isPremium && remainingTime !== 'Expired' && (
                  <span className="ml-1 pl-1 border-l border-primary/20 text-[8px] opacity-70">
                    {remainingTime}
                  </span>
                )}
              </div>

              {/* Premium Details Tooltip */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-secondary p-4 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] transform translate-y-2 group-hover:translate-y-0">
                <div className="space-y-3">
                  {isPremium ? (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Premium Plan</p>
                        <p className="text-white font-bold">{userData.premiumPlan}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Expires</p>
                        <p className="text-white font-bold">
                          {userData.premiumPlan === 'Lifetime' ? 'Never Expires' : userData.premiumExpiry?.toDate().toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      {userData.premiumPlan !== 'Lifetime' && userData.premiumExpiry && (
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Remaining</p>
                          <p className="text-primary font-bold font-mono">
                            {remainingTime}
                          </p>
                        </div>
                      )}
                    </>
                  ) : userData.premiumStatus === 'expired' ? (
                    <div className="text-center space-y-2">
                      <p className="text-red-500 font-bold text-sm uppercase tracking-tight">Access Expired</p>
                      <p className="text-gray-400 text-[10px]">Your premium privileges have been automatically revoked. Contact admin to renew.</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <p className="text-white font-bold text-sm uppercase tracking-tight">Free Account</p>
                      <p className="text-gray-400 text-[10px]">Upgrade to Premium for full access to all resources and features.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowProfile(true)}
            className="p-2 text-text-main hover:bg-surface rounded-lg transition-colors"
            title="Profile"
          >
            <User size={20} />
          </button>

          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold border-2 border-red-500/20 transition-all group"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Hamburger */}
          <button className="md:hidden p-2 text-text-main" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background-main mt-4 border-t border-surface overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Home</Link>
              <Link to="/resources" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Resources</Link>
              <Link to="/ai-assistant" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold flex items-center justify-center gap-2"><Bot size={18}/> AI Assistant</Link>
              <button onClick={() => { setIsOpen(false); setShowProfile(true); }} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Profile</button>
              {isPremium && (
                <>
                  <Link to="/bookmarks" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Bookmarks</Link>
                  <Link to="/folders" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Folders</Link>
                </>
              )}
              {(userData?.role === 'admin' || userData?.role === 'superadmin' || user?.email === 'aasimmuneer349@gmail.com') && (
                <a href="/admin.html" onClick={() => setIsOpen(false)} className="text-center p-3 text-purple-400 border-2 border-purple-500/20 bg-purple-500/5 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Shield size={18} /> Admin Panel
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
