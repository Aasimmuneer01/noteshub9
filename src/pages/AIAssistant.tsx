import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Send, User, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../types';

import { doc, onSnapshot, addDoc, collection, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AIAssistant() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'ai_settings', 'status'), (docSnap) => {
        if (docSnap.exists()) {
            setAiEnabled(docSnap.data().enabled);
        }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (chatId && userData?.uid) {
        const fetchChat = async () => {
            const chatSnap = await getDoc(doc(db, 'users', userData.uid, 'chats', chatId));
            if (chatSnap.exists()) {
                setMessages(chatSnap.data().messages || []);
            }
        };
        fetchChat();
    }
  }, [chatId, userData]);

  const sendMessage = async () => {
    if (!aiEnabled) return;
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
      provider: 'Groq',
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        createdAt: new Date(),
        provider: 'Groq',
      };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to Firestore
      if (userData?.uid) {
          if (chatId) {
              await updateDoc(doc(db, 'users', userData.uid, 'chats', chatId), {
                  messages: finalMessages,
                  updatedAt: new Date()
              });
          } else {
              const newChat = await addDoc(collection(db, 'users', userData.uid, 'chats'), {
                  title: userMessage.content.substring(0, 30),
                  subject: 'General',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  messages: finalMessages
              });
              navigate('/ai-assistant?chatId=' + newChat.id, { replace: true });
          }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date(),
        provider: 'Groq',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!aiEnabled) {
    return (
        <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow border border-gray-200 mt-20">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">AI Assistant Temporarily Unavailable</h2>
            <p className="text-gray-600 mb-4">
                The AI Assistant has been temporarily disabled by the NotesHub9 Administrator.
            </p>
            <p className="text-gray-600">
                If you believe this is an error or need assistance, please contact us at: <a href="mailto:noteshub9.official@gmail.com" className="text-blue-600 underline">noteshub9.official@gmail.com</a>
            </p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 mt-16 max-w-2xl mx-auto shadow-xl rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white font-semibold flex justify-between items-center">
        <span>NotesHub9 AI Assistant</span>
        <div className='flex gap-2 items-center'>
            <button onClick={() => navigate('/ai-history')} className='text-sm bg-white/20 px-2 py-1 rounded'>History</button>
            <button onClick={() => navigate('/')}><X size={20}/></button>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map(m => (
          <div key={m.id} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
                <Bot size={16}/>
              </div>
            )}
            <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 shadow-sm text-gray-900'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
              <Bot size={16}/>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm text-gray-900">
              AI is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-full">
          <input 
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 font-medium"
            placeholder="Type hereeee..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="p-1.5 text-gray-500"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
