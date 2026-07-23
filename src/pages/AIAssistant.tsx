import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Clock, Send, Paperclip, Mic, Bot, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Message, Chat } from '../types';

import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AIAssistant() {
  const { userData, isPremium } = useAuth();
  const navigate = useNavigate();
  const [selectedAI, setSelectedAI] = useState('Groq');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [usage, setUsage] = useState<{ count: number } | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userData?.uid) {
      // Fetch Usage
      getDoc(doc(db, 'users', userData.uid, 'aiUsage', 'stats'))
        .then(snap => {
           setUsage(snap.exists() ? snap.data() : { count: 0 });
        })
        .catch(err => console.error(err));

      // Fetch Chats
      // Chats don't have a rule, so this might fail, but we catch it
      getDocs(query(collection(db, 'users', userData.uid, 'chats'), orderBy('updatedAt', 'desc')))
        .then(snap => {
          const fetchedChats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setChats(fetchedChats);
        })
        .catch(err => {
          console.error(err);
          setChats([]);
        });
    }
  }, [userData]);
  const sendMessage = async () => {
    if (selectedAI !== 'Groq') {
      alert("Google Gemini is not available yet. Please select Groq.");
      return;
    }
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
      provider: 'Groq',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        createdAt: new Date(),
        provider: 'Groq',
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-background-main text-text-main">
      {/* History Drawer */}
      {historyOpen && (
        <div className="absolute inset-0 z-20 w-full sm:w-64 border-r border-secondary p-4 bg-surface overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Chat History</h2>
            <button onClick={() => setHistoryOpen(false)}>Close</button>
          </div>
          <div className="space-y-2">
            {chats.map(chat => (
              <div key={chat.id} className="p-3 bg-background-main rounded-lg cursor-pointer hover:bg-secondary">
                <p className="font-bold truncate">{chat.title}</p>
                <p className="text-xs text-gray-400">{new Date(chat.updatedAt.seconds * 1000).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-secondary flex items-center justify-between gap-2 flex-wrap">
            <button onClick={() => navigate(-1)}><ArrowLeft /></button>
            <h1 className="font-bold truncate flex-1 text-center sm:text-left">Premium AI Assistant 👑</h1>
            <div className="flex gap-2">
                <button onClick={() => setHistoryOpen(!historyOpen)}><Clock /></button>
                <button onClick={() => navigate('/profile')}><Settings /></button>
            </div>
        </div>
        
        {/* Status Card & Model Selector */}
        <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="bg-surface p-4 rounded-xl flex-1 border border-secondary text-sm">
                <span className="text-green-500 font-bold">🟢 AI Online</span>
                <p>Usage: {usage?.count || 0} / 100 Messages</p>
                <p>Plan: {isPremium ? 'Premium Active' : 'Free'}</p>
            </div>
            <select 
                className="bg-surface border border-secondary rounded-xl p-2 h-fit w-full sm:w-auto"
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
            >
                <option>Groq</option>
                <option>Gemini (Coming Soon)</option>
            </select>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center pt-10">
              <h2 className="text-xl font-bold">How can I help you today?</h2>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`p-4 rounded-xl ${m.role === 'user' ? 'bg-primary ml-auto' : 'bg-surface mr-auto'}`}>
              {m.content}
            </div>
          ))}
          {isTyping && <div className="text-sm opacity-50">AI is typing...</div>}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-secondary bg-background-main">
          <div className="flex items-center gap-2 bg-surface p-2 rounded-xl">
            <button><Paperclip /></button>
            <input 
              className="flex-1 bg-transparent outline-none p-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button><Mic /></button>
            <button onClick={sendMessage} className="p-2 bg-primary text-white rounded-lg"><Send /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
