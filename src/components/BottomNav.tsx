import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Bot } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'AI', path: '/ai-assistant', icon: Bot },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-secondary py-2 px-4 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.name} to={item.path} className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            <Icon size={24} />
            <span className="text-[10px] font-bold uppercase">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
