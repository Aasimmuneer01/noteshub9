import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, where, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

export default function BroadcastNotification() {
  const { user, userData, loading } = useAuth();
  const [broadcast, setBroadcast] = useState<any>(null);

  useEffect(() => {
    if (!user || loading) return;

    // Listen to broadcast messages
    const broadcastQuery = query(
      collection(db, 'chats', 'community', 'messages'),
      where('isBroadcast', '==', true)
    );

    const unsub = onSnapshot(broadcastQuery, (snapshot) => {
      if (snapshot.empty) {
        setBroadcast(null);
        return;
      }

      // Sort client-side
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        
      const latestBroadcast = messages[0];
      
      // Only show if it's new (not read by user yet)
      const lastRead = userData?.lastReadChats?.['community'] || new Timestamp(0, 0);
      
      if (latestBroadcast.timestamp && latestBroadcast.timestamp > lastRead) {
        setBroadcast(latestBroadcast);
      } else {
        setBroadcast(null);
      }
    });

    return unsub;
  }, [user, userData, loading]);

  if (!broadcast) return null;

  return (
    <AnimatePresence>
      {broadcast && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-4 right-4 md:left-1/4 md:right-1/4 z-50 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg text-yellow-900"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={20} className="text-yellow-600" />
              <span>Admin Message</span>
            </div>
            <button onClick={() => setBroadcast(null)} className="text-yellow-700 hover:text-yellow-900">
              <X size={20} />
            </button>
          </div>
          <p className="mb-4 text-sm">{broadcast.content}</p>
          <div className="flex justify-between items-center text-xs text-yellow-700">
            <span>{broadcast.timestamp?.toDate().toLocaleString()}</span>
            <button 
              onClick={async () => {
                if (user && broadcast.timestamp) {
                  await updateDoc(doc(db, 'users', user.uid), {
                    [`lastReadChats.community`]: broadcast.timestamp
                  });
                  setBroadcast(null);
                }
              }}
              className="px-3 py-1 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
