import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, Timestamp, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';

export default function UnreadNotification() {
  const { user, userData } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !userData) return;

    const communityQuery = query(collection(db, 'chats', 'community', 'messages'), orderBy('timestamp', 'desc'));

    const unsub = onSnapshot(communityQuery, (snapshot) => {
      let count = 0;
      const lastRead = userData.lastReadChats?.['community'] || new Timestamp(0, 0);
      
      snapshot.docs.forEach(doc => {
        const msg = doc.data() as any;
        if (msg.timestamp && msg.timestamp > lastRead && msg.senderId !== user.uid && !msg.isBroadcast) {
          count++;
        }
      });
      
      setUnreadCount(count);

      if (count > 0) {
        setShowNotification(true);
      } else {
        setShowNotification(false);
      }
    });

    return unsub;
  }, [user, userData]);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          className="fixed top-20 right-4 z-50 p-4 bg-white border border-secondary rounded-xl shadow-lg text-black w-80"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 font-bold text-primary">
              <MessageSquare size={18} />
              <span>Notifications</span>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-gray-400 hover:text-black">
              <X size={18} />
            </button>
          </div>
          
          {unreadCount > 0 && (
            <p className="mb-4 text-sm text-gray-600">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}.</p>
          )}

          <button 
            onClick={async () => {
              if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                  [`lastReadChats.community`]: serverTimestamp()
                });
              }
              navigate('/chat');
              setShowNotification(false);
            }}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg font-bold hover:brightness-110"
          >
            Open Chat
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
