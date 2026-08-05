import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MessageSquareOff, Ban } from 'lucide-react';

export default function Chat() {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<'community' | string>('community');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const navigate = useNavigate();

  const lastReadCommunity = userData?.lastReadChats?.community;

  useEffect(() => {
    localStorage.setItem('activeChat', activeChat);
    return () => localStorage.removeItem('activeChat');
  }, [activeChat]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isBanned) {
          setIsBanned(true);
        } else {
          setIsBanned(false);
        }
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'website_control', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.chatEnabled !== undefined) {
          setChatEnabled(data.chatEnabled);
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const fetchedUsers: any[] = querySnapshot.docs.filter(d => d.id !== user?.uid).map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Add a dummy user for testing if no other users exist
        if (fetchedUsers.length === 0) {
          fetchedUsers.push({
            id: 'dummy-user-123',
            displayName: 'Test User (Demo)',
            email: 'test@example.com'
          });
        }
        
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Mark as read if community is selected
    if (activeChat === 'community') {
      updateDoc(doc(db, 'users', user.uid), {
        [`lastReadChats.community`]: serverTimestamp()
      });
    }

    const path = activeChat === 'community' ? 'chats/community/messages' : `chats/${activeChat}/messages`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [user, activeChat]);

  const startPrivateChat = async (otherUserId: string) => {
    console.log('Starting chat with:', otherUserId);
    console.log('Current user:', user?.uid);
    const chatId = [user?.uid, otherUserId].sort().join('_');
    console.log('ChatId:', chatId);
    try {
      await setDoc(doc(db, 'chats', chatId), {
        type: 'private',
        participants: [user?.uid, otherUserId]
      }, { merge: true });
      
      // Update lastRead
      await updateDoc(doc(db, 'users', user!.uid), {
        [`lastReadChats.${chatId}`]: serverTimestamp()
      });

      setActiveChat(chatId);
      setSelectedUserId(otherUserId);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatEnabled || isBanned) {
      alert("You are not allowed to send messages.");
      return;
    }
    if (!newMessage.trim() || !user) return;
    const path = activeChat === 'community' ? 'chats/community/messages' : `chats/${activeChat}/messages`;
    await addDoc(collection(db, path), {
      senderId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  if (!chatEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-surface text-center p-4">
        <div className="bg-background-main p-8 rounded-3xl max-w-md border border-secondary shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
            <MessageSquareOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-3">Chat Disabled</h2>
          <p className="text-text-secondary mb-8">Chat has been temporarily disabled by the administrator.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-surface text-center p-4">
        <div className="bg-background-main p-8 rounded-3xl max-w-md border border-secondary shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-6">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-3">Account Restricted</h2>
          <p className="text-text-secondary mb-8">Your account has been restricted from participating in chats.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface">
      {/* Header with Dropdown */}
      <div className="p-4 border-b border-secondary">
        <select 
          value={selectedUserId || 'community'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'community') {
              setActiveChat('community');
              setSelectedUserId(null);
            } else {
              startPrivateChat(value);
            }
          }}
          className="w-full p-3 bg-background-main border border-secondary rounded-xl text-text-main"
        >
          <option value="community">📢 NotesHub9 Community</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>👤 {u.displayName || u.email}</option>
          ))}
        </select>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-4 p-4 bg-background-main rounded-xl border border-secondary">
          {messages.map(msg => {
            if (msg.isBroadcast) {
              return (
                <div key={msg.id} className="mb-4 text-left">
                  <div className="text-xs text-text-secondary mb-1 ml-2">Message from Admin</div>
                  <div className="inline-block p-3 rounded-2xl bg-yellow-100 text-yellow-900 border border-yellow-200">
                    <p className="font-bold mb-1">📢 Admin Announcement</p>
                    <p>{msg.content}</p>
                    <div className="text-xs text-yellow-700 mt-2">{msg.timestamp?.toDate().toLocaleString()}</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`mb-4 flex flex-col ${msg.senderId === user?.uid ? 'items-end text-right' : 'items-start text-left'}`}>
                <div className="group relative flex items-center gap-2">
                  {msg.senderId === user?.uid && !msg.deleted && (
                    <button 
                      onClick={() => {
                        const path = activeChat === 'community' ? 'chats/community/messages' : `chats/${activeChat}/messages`;
                        updateDoc(doc(db, path, msg.id), {
                          deleted: true,
                          text: "This message was deleted."
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-2 transition-opacity"
                      title="Delete for everyone"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                  <div className={`inline-block p-3 rounded-2xl ${msg.senderId === user?.uid ? 'bg-primary text-white' : 'bg-secondary text-text-main'}`}>
                    {msg.deleted ? (
                      <span className="italic text-sm opacity-70">This message was deleted.</span>
                    ) : (
                      <>{msg.text}</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-3 bg-background-main border border-secondary rounded-xl text-text-main"
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="px-6 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90">Send</button>
        </div>
      </div>
    </div>
  );
}
