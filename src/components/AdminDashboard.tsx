import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UsersManager } from './Admin/UsersManager';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'analytics', 'summary'), (doc) => {
        setAnalytics(doc.data());
    });
    return () => unsub();
  }, []);

  if (!analytics) return <div className="p-4">Loading analytics...</div>;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'ai', label: 'AI Management' },
    { id: 'website', label: 'Website Control' },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="flex space-x-4 border-b border-gray-200">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 font-semibold ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h2 className="text-gray-500 text-sm">Total Emails Received</h2>
                    <p className="text-3xl font-bold">{analytics.totalEmailsReceived || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h2 className="text-gray-500 text-sm">Total AI Replies Sent</h2>
                    <p className="text-3xl font-bold text-green-600">{analytics.totalAIRepliesSent || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h2 className="text-gray-500 text-sm">Failed Replies</h2>
                    <p className="text-3xl font-bold text-red-600">{analytics.failedReplies || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h2 className="text-gray-500 text-sm">Pending Emails</h2>
                    <p className="text-3xl font-bold text-yellow-600">--</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border mt-4">
                <h2 className="font-semibold mb-4">Latest Activity</h2>
                <div className="space-y-2">
                    <p className="text-sm">Last Received: {analytics.lastReceivedEmail || 'N/A'}</p>
                    <p className="text-sm">Last Reply: {analytics.lastReplyTime || 'N/A'}</p>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'users' && <UsersManager />}

      {activeTab !== 'dashboard' && activeTab !== 'users' && (
          <div className="p-8 text-center text-gray-500">Feature '{activeTab}' coming soon.</div>
      )}
    </div>
  );
}
