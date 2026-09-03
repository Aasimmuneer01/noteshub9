import React, { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Clock } from 'lucide-react';

export function MaintenanceCountdown({ settings }: { settings: any }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = settings.startTime?.toDate().getTime();
      
      if (start && start > now) {
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  if (!timeLeft) return null;

  return (
    <div className="bg-red-600 text-white p-3 text-center flex items-center justify-center gap-2 font-bold shadow-lg">
      <Megaphone size={20} />
      <span>{settings.announcement || `Important: NotesHub9 will be under ${settings.mode.toLowerCase()} soon.`}</span>
      <div className="flex items-center gap-1 bg-red-800 px-2 py-1 rounded">
        <Clock size={16} />
        {settings.mode} begins in {timeLeft}
      </div>
    </div>
  );
}
