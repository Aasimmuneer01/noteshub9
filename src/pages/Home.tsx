import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Crown, Sparkles, ChevronRight, X, ArrowRight, Layers, MessageSquare, Play, Bot, FileText, CheckCircle, Shield, Users, Clock, Star } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Resource } from '../types';
import CreatorSection from '../components/CreatorSection';
import PremiumExpiryCounter from '../components/PremiumExpiryCounter';

import { AnnouncementBar } from '../components/AnnouncementBar';

export default function Home() {
  const { user, isPremium, userData } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [enabledAssistants, setEnabledAssistants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Featured Notes (mocking by taking highest views)
        const featuredQuery = query(collection(db, 'resources'), orderBy('viewCount', 'desc'), limit(4));
        const featuredSnap = await getDocs(featuredQuery);
        setFeaturedResources(featuredSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));

        // Fetch Recently Added
        const recentQuery = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(4));
        const recentSnap = await getDocs(recentQuery);
        setRecentResources(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));

        // Fetch AI Assistants
        try {
          const aiSettingsRef = doc(db, 'ai_settings', 'config');
          const aiSnap = await getDoc(aiSettingsRef);
          if (aiSnap.exists()) {
            const config = aiSnap.data();
            if (config.assistants) {
              setEnabledAssistants(config.assistants.filter((a: any) => a.enabled));
            }
          }
        } catch (e) {
          console.warn("Could not fetch AI assistants:", e);
        }
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamiat', 'Pak Studies'];

  return (
    <div className="flex flex-col min-h-screen bg-background-main pb-24">
      {/* Announcement Bar */}
      <AnnouncementBar />

      <div className="max-w-7xl mx-auto w-full px-4 pt-8 pb-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-4 md:pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-secondary text-xs font-bold text-gray-300 uppercase tracking-wider mb-2"
          >
            <Sparkles size={14} className="text-primary" />
            Class 9 Study Hub
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white"
          >
            Smart. Searchable. <span className="text-primary">Free.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Access high-quality PDF notes, AI-powered study assistance, and a community of students striving for excellence.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto mt-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search for notes, subjects, or topics..." 
              className="w-full pl-12 pr-32 py-4 bg-surface rounded-2xl border border-secondary text-white focus:outline-none focus:border-primary shadow-lg transition-colors text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Search
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-3 px-6 py-3 bg-surface border border-surface-border rounded-xl text-text-main font-semibold hover:bg-surface-light hover:border-primary/50 transition-all shadow-lg shadow-black/20 active:scale-95"
            >
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <MessageSquare size={18} className="text-primary" />
              </div>
              Global Chat
              <ArrowRight size={18} className="ml-1 text-text-muted" />
            </button>
          </motion.div>
        </section>

        {/* Categories / Subject Chips */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {categories.map((cat, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.05) }}
                key={cat}
                className="snap-start shrink-0"
              >
                <Link 
                  to={`/resources?subject=${encodeURIComponent(cat)}`}
                  className="px-6 py-3 bg-surface border border-secondary rounded-2xl text-sm font-bold text-gray-300 hover:border-primary hover:text-white transition-all flex items-center gap-2"
                >
                  <BookOpen size={16} className="text-primary" />
                  {cat}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Notes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              Featured Notes
            </h2>
            <Link to="/resources" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse border border-secondary"></div>
              ))
            ) : featuredResources.length > 0 ? (
              featuredResources.map(resource => (
                <Link 
                  key={resource.id} 
                  to={`/viewer/${resource.id}`}
                  className="p-5 bg-surface rounded-2xl border border-secondary hover:border-primary transition-all group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-background-main rounded-lg border border-secondary text-primary">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-background-main rounded-md border border-secondary text-gray-400">
                        {resource.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400 font-medium">
                      {resource.viewCount || 0} views
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center border border-dashed border-secondary rounded-2xl text-gray-500">
                No featured notes yet.
              </div>
            )}
          </div>
        </section>

        {/* Two Column Section: AI & Premium */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Study Assistant */}
          <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-surface to-background-main border border-secondary group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 border border-primary/30">
                <Bot className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">AI Study Assistant</h2>
              <p className="text-gray-400 mb-6 flex-1 text-sm leading-relaxed">
                Stuck on a problem? Our AI understands Class 9 syllabus and can explain concepts step-by-step.
              </p>
              
              <div className="space-y-3 mb-8">
                {enabledAssistants.slice(0, 2).map((assistant, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300 bg-background-main/50 p-3 rounded-xl border border-secondary">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span className="truncate">{assistant.name}</span>
                  </div>
                ))}
                {enabledAssistants.length === 0 && (
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-300 bg-background-main/50 p-3 rounded-xl border border-secondary">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span>General Study Helper</span>
                  </div>
                )}
              </div>

              <Link 
                to={user ? "/ai-assistant" : "/login"} 
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-center hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(var(--color-primary),0.3)]"
              >
                Try AI Assistant <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Premium Section */}
          <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-surface border border-indigo-500/30 group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/30">
                <Crown className="text-indigo-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">NotesHub Premium</h2>
              <p className="text-gray-400 mb-6 flex-1 text-sm leading-relaxed">
                Unlock offline downloads, unlimited AI chats, and ad-free viewing.
              </p>
              
              <ul className="space-y-3 mb-8">
                {['Unlimited PDF Downloads', 'Priority AI Access', 'Exclusive Study Materials'].map((perk, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    <Shield size={16} className="text-indigo-400 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              {isPremium && userData?.premiumExpiry && userData?.premiumPlan !== 'Lifetime' && (
                <div className="mb-4">
                  <PremiumExpiryCounter expiryDate={userData.premiumExpiry} />
                </div>
              )}

              <Link 
                to={user ? "/profile#subscription" : "/login"} 
                className="w-full py-4 bg-white text-indigo-900 rounded-xl font-bold text-center hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
              </Link>
            </div>
          </div>
        </section>

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="text-blue-500" size={24} />
              Recently Added
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse border border-secondary"></div>
              ))
            ) : recentResources.length > 0 ? (
              recentResources.map(resource => (
                <Link 
                  key={resource.id} 
                  to={`/viewer/${resource.id}`}
                  className="flex items-center p-4 bg-surface rounded-2xl border border-secondary hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 bg-background-main rounded-xl border border-secondary flex items-center justify-center text-primary mr-4 group-hover:scale-110 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{resource.title}</h3>
                    <p className="text-xs text-gray-400 truncate">{resource.category} • Added recently</p>
                  </div>
                  <div className="ml-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all">
                    <Play size={14} className="ml-0.5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border border-dashed border-secondary rounded-2xl text-gray-500">
                No recent notes.
              </div>
            )}
          </div>
        </section>
        <CreatorSection />

      </div>
    </div>
  );
}
