import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Search, Crown, Clock, Star, Zap, Layers } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Resource } from '../types';
import CreatorSection from '../components/CreatorSection';

export default function Home() {
  const { user, isPremium, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [homepageSettings, setHomepageSettings] = useState({
    title: 'Educational Resources',
    subtitle: 'Find Class 9 Notes Instantly',
    bgImage: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop'
  });
  const [latestResources, setLatestResources] = useState<Resource[]>([]);

  useEffect(() => {
    const fetchHomepageSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'homepage');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHomepageSettings({
            title: data.title || 'Educational Resources',
            subtitle: data.subtitle || 'Find Class 9 Notes Instantly',
            bgImage: data.bgImage || data.heroImage || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop'
          });
        }
      } catch (err) {
        console.warn("Could not fetch homepage settings:", err);
      }
    };
    
    const fetchLatestResources = async () => {
      try {
        const resourcesQuery = query(
          collection(db, 'resources'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        const querySnapshot = await getDocs(resourcesQuery);
        const resources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        setLatestResources(resources);
      } catch (err) {
        console.error("Could not fetch latest resources:", err);
      }
    };

    fetchHomepageSettings();
    fetchLatestResources();
  }, []);

  const categories = ['Maths', 'Science', 'Biology', 'Chemistry', 'Urdu', 'English'];
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-8 pb-24 bg-background-main min-h-screen">
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-6">
        <div className="flex justify-end mb-4">
           <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPremium ? 'bg-primary text-white' : 'bg-surface border border-secondary text-gray-400'}`}>
             {isPremium ? '👑 Premium' : 'Free Account'}
           </div>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-main mb-2">Welcome back!</h1>
          <p className="text-gray-400 text-sm">{homepageSettings.subtitle}</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search notes..." 
            className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-secondary text-text-main focus:outline-none focus:border-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <Link 
              key={cat} 
              to={`/resources?subject=${encodeURIComponent(cat)}`}
              className="px-4 py-2 bg-surface border border-secondary rounded-full text-sm font-bold text-text-main hover:border-primary transition-all whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Premium & AI Cards */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-primary to-blue-600 rounded-3xl text-white shadow-lg">
          <Crown className="mb-4" />
          <h3 className="text-xl font-bold mb-2">Premium Membership</h3>
          <p className="text-sm opacity-90 mb-4">Unlock downloads, AI assistant, and more.</p>
          <Link to="/resources" className="block text-center w-full py-3 bg-white text-blue-600 rounded-xl font-bold">Upgrade Now</Link>
        </div>
        <div className="p-6 bg-surface border border-secondary rounded-3xl shadow-sm">
          <Zap className="mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2 text-text-main">AI Assistant</h3>
          <p className="text-sm text-gray-400 mb-4">Ask questions, solve homework and learn faster.</p>
          <Link to="/ai-assistant" className="block text-center w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all">Start Chatting</Link>
        </div>
      </section>

      {/* Latest & Popular */}
      <section className="px-4 space-y-4">
        <h2 className="text-lg font-bold text-text-main">Latest Resources</h2>
        <div className="grid grid-cols-2 gap-4">
          {latestResources.map(resource => (
            <Link 
              key={resource.id} 
              to={`/viewer/${resource.id}`}
              className="p-4 bg-surface rounded-2xl border border-secondary hover:border-primary transition-all"
            >
              <Layers className="text-primary mb-2" />
              <h4 className="font-bold text-text-main truncate">{resource.title}</h4>
              <p className="text-xs text-gray-400 truncate">{resource.category} • {resource.viewCount} views</p>
            </Link>
          ))}
          {latestResources.length === 0 && (
            <p className="text-sm text-gray-400 col-span-2 text-center py-4">No resources found.</p>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <button 
        onClick={focusSearch}
        className="fixed bottom-20 right-6 p-4 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform z-40"
      >
        <Search size={24} />
      </button>

      <CreatorSection />
    </div>
  );
}
