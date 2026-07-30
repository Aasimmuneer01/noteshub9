import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Chat } from '../types';
import { Trash2, MessageSquare, ArrowLeft, Edit2 } from 'lucide-react';

export default function AIChatHistory() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (userData?.uid) {
      fetchChats();
    }
  }, [userData]);

  const fetchChats = async () => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, 'users', userData.uid, 'chats'),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    const fetchedChats = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Chat[];
    setChats(fetchedChats);
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting chat:', id, 'User:', userData?.uid);
    if (window.confirm('Delete this conversation?')) {
      if (!userData?.uid) {
        console.error('Cannot delete chat: user ID is missing');
        return;
      }
      await deleteDoc(doc(db, 'users', userData.uid, 'chats', id));
      setChats(prev => prev.filter(c => c.id !== id));
    }
  };

  const renameChat = async (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Renaming chat:', id, 'User:', userData?.uid);
    const newTitle = window.prompt('Enter new chat title:', currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      if (!userData?.uid) {
        console.error('Cannot rename chat: user ID is missing');
        return;
      }
      await updateDoc(doc(db, 'users', userData.uid, 'chats', id), { title: newTitle });
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mt-16">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/ai-assistant')}><ArrowLeft /></button>
        <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
      </div>
      <div className="space-y-4">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            className="p-4 bg-white rounded-xl shadow border flex items-center justify-between"
          >
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 flex-grow"
              onClick={() => navigate('/ai-assistant?chatId=' + chat.id)}
            >
                <MessageSquare className='text-blue-500'/>
                <div>
                    <p className="font-bold text-gray-900">{chat.title}</p>
                    <p className="text-xs text-gray-400">{chat.updatedAt ? new Date(chat.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
            <div className='flex items-center gap-2'>
              <button type="button" onClick={(e) => renameChat(chat.id, chat.title, e)} className='text-blue-500 p-2 hover:bg-blue-50 rounded-full'><Edit2 size={18}/></button>
              <button type="button" onClick={(e) => deleteChat(chat.id, e)} className='text-red-500 p-2 hover:bg-red-50 rounded-full'><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
        {chats.length === 0 && <p className='text-center text-gray-500 py-10'>No chat history found.</p>}
      </div>
    </div>
  );
}
