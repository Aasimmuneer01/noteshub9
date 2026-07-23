import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, changePassword, userData } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'banned': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await changePassword(newPassword);
      setMessage('Password updated successfully');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-main border border-secondary p-6 rounded-2xl w-full max-w-sm shadow-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Profile</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Email</p>
            <p className="text-text-main font-mono">{user?.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Account Status</p>
            <p className={`font-bold ${getStatusColor(userData?.accountStatus)}`}>{userData?.accountStatus?.toUpperCase() || 'ACTIVE'}</p>
          </div>
          <div className="border-t border-secondary pt-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Change Password</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-surface border border-secondary rounded-lg p-2 text-text-main mb-2"
            />
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-all"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {message && <p className="text-green-500 text-xs mt-2">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
