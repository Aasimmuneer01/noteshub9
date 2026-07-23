import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Shield, Lock, Settings, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { userData, isPremium, logout, changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      </div>
    </div>
  );
}
