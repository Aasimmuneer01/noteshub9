import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, Timestamp, updateDoc, serverTimestamp, doc, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';

export default function UnreadNotification() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);

  const userDataRef = React.useRef(userData);
  
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    if (!user) return;

    let messageUnsubs: (() => void)[] = [];

    // Listen to all chats the user is part of + community chat
    const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    
    const unsubChats = onSnapshot(chatsQuery, (snapshot) => {
        // Clean up previous message listeners
        messageUnsubs.forEach(unsub => unsub());
        messageUnsubs = [];

        // Collect chat IDs, ensuring 'community' is included
        const chatIds = new Set(snapshot.docs.map(doc => doc.id));
        chatIds.add('community');
        
        Array.from(chatIds).forEach(chatId => {
            const path = chatId === 'community' ? 'chats/community/messages' : `chats/${chatId}/messages`;
            const q = query(collection(db, path), orderBy('timestamp', 'desc'));
            
            const unsub = onSnapshot(q, (msgSnapshot) => {
                const currentUserData = userDataRef.current;
                const lastRead = currentUserData?.lastReadChats?.[chatId] || new Timestamp(0, 0);
                const newMessages = msgSnapshot.docs
                    .map(doc => ({ id: doc.id, chatId, ...doc.data() } as any))
                    .filter(msg => msg.timestamp && msg.timestamp > lastRead && msg.senderId !== user.uid);
                
                setUnreadMessages(prev => {
                  const filtered = prev.filter(m => m.chatId !== chatId);
                  const updated = [...filtered, ...newMessages];
                  
                  if (newMessages.length > 0) {
                     const isCurrentlyInChat = window.location.pathname === '/chat' && localStorage.getItem('activeChat') === chatId;
                     if (isCurrentlyInChat) {
                         updateDoc(doc(db, 'users', user.uid), {
                           [`lastReadChats.${chatId}`]: serverTimestamp()
                         });
                     } else {
                         setShowNotification(true);
                     }
                  }
                  
                  return updated;
                });
            }, (error) => {
               console.error("Error in message snapshot:", error);
            });
            messageUnsubs.push(unsub);
        });
    }, (error) => {
        console.error("Error in chats snapshot:", error);
    });
    
    return () => {
        unsubChats();
        messageUnsubs.forEach(unsub => unsub());
    };
  }, [user]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdate', { detail: unreadMessages.length }));
  }, [unreadMessages]);

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
            <button onClick={() => {setShowNotification(false); setUnreadMessages([])}} className="text-gray-400 hover:text-black">
              <X size={18} />
            </button>
          </div>
          
          {unreadMessages.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              <p className="font-bold mb-2">New messages:</p>
              {unreadMessages && unreadMessages.slice && unreadMessages.slice(0, 3).map(msg => (
                <div key={msg.id} className="mb-2 p-2 bg-gray-100 rounded">
                  <p><strong>{msg.senderName || (msg.senderId ? String(msg.senderId).slice(0, 8) : 'Unknown')}:</strong> {String(msg.content || msg.text || '').slice(0, 30)}...</p>
                </div>
              ))}
              {unreadMessages.length > 3 && <p>...and {unreadMessages.length - 3} more.</p>}
            </div>
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
