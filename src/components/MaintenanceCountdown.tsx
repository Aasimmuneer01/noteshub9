import React, { useState, useEffect } from 'react';
import { Megaphone, Clock } from 'lucide-react';

export function MaintenanceCountdown({ settings }: { settings: any }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [modeLabel, setModeLabel] = useState<string>('maintenance');
  const [isUpcoming, setIsUpcoming] = useState<boolean>(true);

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();

      let start: number | undefined = undefined;
      if (settings?.startTime) {
        if (typeof settings.startTime.toDate === 'function') {
          start = settings.startTime.toDate().getTime();
        } else if (settings.startTime instanceof Date) {
          start = settings.startTime.getTime();
        } else if (typeof settings.startTime === 'string' || typeof settings.startTime === 'number') {
          start = new Date(settings.startTime).getTime();
        }
      }

      let restore: number | undefined = undefined;
      if (settings?.restoreTime) {
        if (typeof settings.restoreTime.toDate === 'function') {
          restore = settings.restoreTime.toDate().getTime();
        } else if (settings.restoreTime instanceof Date) {
          restore = settings.restoreTime.getTime();
        } else if (typeof settings.restoreTime === 'string' || typeof settings.restoreTime === 'number') {
          restore = new Date(settings.restoreTime).getTime();
        }
      }

      const scheduleEnabled = !!settings?.enabled;
      const scheduleUpcoming = scheduleEnabled && start !== undefined && start > now;
      
      const manualActive = settings?.mode && settings.mode !== 'Online' && settings.mode !== 'Normal';
      const scheduleActive = scheduleEnabled && start !== undefined && now >= start && (restore === undefined || now < restore);

      const currentMode = settings?.mode === 'Shutdown' ? 'shutdown' : 'maintenance';
      setModeLabel(currentMode);

      console.log("[MaintenanceCountdown Debug]", {
        scheduleEnabled,
        scheduleUpcoming,
        scheduleActive,
        manualActive,
        start,
        restore,
        now
      });

      if (scheduleUpcoming && start !== undefined) {
        setIsUpcoming(true);
        const diff = start - now;
        if (diff <= 0) {
          setTimeLeft('00:00:00');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimeLeft(time);
      } else if ((manualActive || scheduleActive) && restore !== undefined && restore > now) {
        setIsUpcoming(false);
        const diff = restore - now;
        if (diff <= 0) {
          setTimeLeft('00:00:00');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimeLeft(time);
      } else {
        setTimeLeft('');
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-red-600 to-rose-600 text-white px-4 py-3 shadow-xl z-50 flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-red-500/30">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 animate-bounce text-amber-200" />
        <span className="font-semibold text-sm sm:text-base tracking-wide">
          {settings?.announcement || (isUpcoming ? `Scheduled Website ${modeLabel} starting in:` : `Website restoration in progress:`)}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full border border-white/20 shadow-inner">
        <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
        <span className="font-mono font-bold text-lg tracking-wider text-amber-100">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
