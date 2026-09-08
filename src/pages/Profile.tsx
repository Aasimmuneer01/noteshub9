import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Shield, Lock, Settings, ChevronRight, Crown, Calendar, Info, CreditCard } from 'lucide-react';
import { useEffect, useRef } from 'react';
import PremiumModal from '../components/PremiumModal';

export default function Profile() {
  const { userData, isPremium, logout, changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const subscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === '#subscription' && subscriptionRef.current) {
      subscriptionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const getDaysRemaining = () => {
    if (userData?.premiumPlan === 'Lifetime' || userData?.premiumType === 'Lifetime') return 'Lifetime';
    const expiry = userData?.premiumExpiry || userData?.premiumExpiryDate;
    if (!expiry) return null;
    const expiryDate = typeof expiry.toDate === "function" ? expiry.toDate() : new Date(expiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getFormattedExpiry = () => {
    const expiry = userData?.premiumExpiry || userData?.premiumExpiryDate;
    if (!expiry) return 'N/A';
    const d = typeof expiry.toDate === "function" ? expiry.toDate() : new Date(expiry); return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await changePassword(password);
      setMessage('Password updated successfully!');
      setPassword('');
    } catch (err) {
      setError('Failed to update password. Please try again.');
    }
  };

  if (!userData) return null;

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-text-main">Profile</h1>

      <div className="bg-surface p-6 rounded-2xl border border-secondary flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="text-primary" size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-main">{userData.displayName}</h2>
          <p className="text-gray-400">{userData.email}</p>
          {isPremium && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              <Shield size={12} /> Premium Member
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          <Settings size={20} /> Settings
        </h3>
        
        <form onSubmit={handlePasswordChange} className="bg-surface p-6 rounded-2xl border border-secondary space-y-4">
          <div className="flex items-center gap-2 font-bold text-text-main">
            <Lock size={18} /> Change Password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password"
            className="w-full p-3 rounded-lg bg-background-main border border-secondary text-text-main"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}
          <button 
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all"
          >
            Update Password
          </button>
        </form>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-between p-4 bg-surface text-red-500 font-bold rounded-2xl border border-secondary hover:border-red-500 transition-all"
        >
          <span>Logout</span>
          <LogOut size={20} />
        </button>
            <div ref={subscriptionRef} className="space-y-4 pt-4 border-t border-secondary">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          <CreditCard size={20} /> Subscription
        </h3>

        <div className="bg-surface p-6 rounded-2xl border border-secondary relative overflow-hidden">
           {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>}
           <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Current Plan</p>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className="text-xl font-bold text-white">
                        {isPremium ? (userData?.premiumPlan || 'Premium') : 'Free Plan'}
                      </h4>
                      {isPremium && <Crown size={18} className="text-yellow-500" />}
                    </div>
                  </div>
                  <div className={"px-3 py-1 rounded-full text-xs font-bold " + (isPremium ? (getDaysRemaining() === 0 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500") : "bg-gray-500/20 text-gray-400")}>
                    {isPremium ? (getDaysRemaining() === 0 ? 'Expired' : 'Active') : 'Free'}
                  </div>
              </div>

              {isPremium && (
                <div className="pt-4 border-t border-secondary/50 space-y-3">
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={16} /> Expiry Date
                      </div>
                      <span className="font-medium text-white">{getFormattedExpiry()}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Info size={16} /> Time Remaining
                      </div>
                      <span className="font-medium text-white">{getDaysRemaining()} {getDaysRemaining() === 'Lifetime' ? '' : 'Days'}</span>
                   </div>
                   {userData?.premiumType === 'global_free' && (
                     <div className="text-xs text-primary bg-primary/10 p-2 rounded-lg mt-2">
                        You have been granted temporary free premium access.
                     </div>
                   )}
                </div>
              )}

              <button
                onClick={() => setShowPremiumModal(true)}
                className={"w-full py-3 rounded-lg font-bold transition-all mt-4 " + (isPremium && getDaysRemaining() !== 0 ? "bg-surface-light border border-secondary text-white hover:bg-secondary" : "bg-primary text-white hover:bg-primary/90")}
              >
                {isPremium ? (getDaysRemaining() === 0 ? 'Renew Premium' : 'Manage Subscription') : 'Upgrade to Premium'}
              </button>
           </div>
        </div>
      </div>
      
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      </div>
    </div>
  );
}
