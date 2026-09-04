import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, Shield, User, Bot, Bookmark, Folder, Star, Settings, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';
import PremiumModal from './PremiumModal';
import { MaintenanceCountdown } from './MaintenanceCountdown';

export default function Navbar({ settings }: { settings?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout, userData, user, isPremium } = useAuth();

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin' || user?.email === 'aasimmuneer349@gmail.com' || user?.email === 'noteshub9.official@gmail.com';

  return (
    <nav className="fixed top-0 w-full z-50 bg-background-main/90 backdrop-blur-md border-b border-surface shadow-md">
      <MaintenanceCountdown settings={settings} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
          <img src="/favicon.png" alt="Logo" className="w-12 h-12 rounded-full" />
          NotesHub9
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 pt-4">
          <Link to="/" className="text-sm font-medium text-text-main/70 hover:text-text-main transition-colors">Home</Link>
          <Link to="/resources" className="text-sm font-medium text-text-main/70 hover:text-text-main transition-colors">Resources</Link>
          <Link to="/ai-assistant" className="text-sm font-medium text-text-main/70 hover:text-text-main transition-colors flex items-center gap-1.5"><Bot size={16}/> AI Assistant</Link>
          <Link to={user ? "/chat" : "/login"} className="text-sm font-medium text-text-main/70 hover:text-text-main transition-colors flex items-center gap-1.5"><MessageSquare size={16}/> Global Chat</Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-full bg-surface hover:bg-surface/80 transition-colors"
            >
              <User size={20} className="text-text-main" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-surface rounded-xl shadow-xl p-2 z-[100]">
                {isPremium && (
                  <>
                    <Link to="/bookmarks" className="flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-background-main rounded-lg" onClick={() => setShowDropdown(false)}><Bookmark size={16}/> Bookmarks</Link>
                    <Link to="/folders" className="flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-background-main rounded-lg" onClick={() => setShowDropdown(false)}><Folder size={16}/> Folders</Link>
                    <button onClick={() => {setShowPremium(true); setShowDropdown(false)}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-background-main rounded-lg"><Star size={16}/> Premium</button>
                  </>
                )}
                {isAdmin && (
                  <a href="/admin.html" className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-background-main rounded-lg"><Shield size={16} /> Admin Panel</a>
                )}
                <button onClick={() => {setShowProfile(true); setShowDropdown(false)}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-background-main rounded-lg"><Settings size={16}/> Settings</button>
                <div className="border-t border-surface my-1" />
                <button onClick={() => {logout(); setShowDropdown(false)}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-background-main rounded-lg"><LogOut size={16}/> Logout</button>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className="md:hidden p-2 text-text-main" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background-main border-b border-surface p-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">Home</Link>
            <Link to="/resources" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">Resources</Link>
            <Link to="/ai-assistant" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">AI Assistant</Link>
            <Link to="/chat" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">Global Chat</Link>
            {isPremium && (
                <>
                    <Link to="/bookmarks" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">Bookmarks</Link>
                    <Link to="/folders" onClick={() => setIsOpen(false)} className="p-3 text-sm font-bold text-text-main hover:bg-surface rounded-lg">Folders</Link>
                </>
            )}
            <button onClick={() => {logout(); setIsOpen(false)}} className="p-3 text-sm font-bold text-red-500 hover:bg-surface rounded-lg text-left">Logout</button>
        </div>
      )}
    </nav>
  );
}
