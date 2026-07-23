import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function CreatorSection() {
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const docRef = doc(db, 'creatorInfo', 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCreator(docSnap.data());
        } else {
          // Provide default creator data if the doc doesn't exist
          setCreator({
            name: 'Aasim Muneer',
            bio: "Hi, I'm Aasim Muneer, a student and aspiring developer. I created this platform to help students easily access study materials, notes, PDFs, assignments, and educational resources in one place. My goal is to make learning simpler, faster, and accessible for everyone.",
            imageUrl: 'https://placehold.co/400x400/1e293b/0ea5e9?text=Developer',
            email: 'noteshub9.official@gmail.com'
          });
        }
      } catch (err) {
        console.warn("Could not fetch creator info, using defaults:", err);
        setCreator({
          name: 'Aasim Muneer',
          bio: "Hi, I'm Aasim Muneer, a student and aspiring developer. I created this platform to help students easily access study materials, notes, PDFs, assignments, and educational resources in one place. My goal is to make learning simpler, faster, and accessible for everyone.",
          imageUrl: 'https://placehold.co/400x400/1e293b/0ea5e9?text=Developer',
          email: 'noteshub9.official@gmail.com'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, []);

  if (loading || !creator) {
    return null; // Or a minimal placeholder
  }

  return (
    <section className="px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-primary font-bold tracking-widest uppercase text-sm">Meet the Developer</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white uppercase tracking-tighter mt-2">
            About the Creator
          </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-surface/50 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-secondary shadow-2xl overflow-hidden group"
        >
          {/* Glassmorphism background effects */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            <div className="shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-surface shadow-xl relative inline-block">
                <img 
                  src={creator.imageUrl === 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop' ? 'https://placehold.co/400x400/1e293b/0ea5e9?text=Developer' : creator.imageUrl || 'https://placehold.co/400x400/1e293b/0ea5e9?text=Developer'} 
                  alt={creator.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{creator.name}</h3>
                <p className="text-primary font-medium text-sm uppercase tracking-wide">Student & Developer</p>
              </div>
              
              <p className="text-gray-400 text-base leading-relaxed">
                {creator.bio}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                {creator.email && (
                  <a 
                    href={`mailto:${creator.email}`} 
                    className="flex items-center justify-center p-3 rounded-full bg-background-main border border-secondary text-gray-400 hover:text-white hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {creator.github && (
                  <a 
                    href={creator.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-full bg-background-main border border-secondary text-gray-400 hover:text-white hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {creator.linkedin && (
                  <a 
                    href={creator.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-full bg-background-main border border-secondary text-gray-400 hover:text-white hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {creator.twitter && (
                  <a 
                    href={creator.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-full bg-background-main border border-secondary text-gray-400 hover:text-white hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                
                {creator.email && (
                  <a 
                    href={`mailto:${creator.email}`} 
                    className="ml-0 md:ml-auto inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-lg hover:bg-gray-100 transition-colors mt-4 md:mt-0"
                  >
                    Contact Me
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
