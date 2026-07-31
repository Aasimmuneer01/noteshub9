import React, { useState, useEffect } from 'react';

interface Props {
  expiryDate: any;
}

export default function PremiumExpiryCounter({ expiryDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!expiryDate) return;

    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  return (
    <div className="text-sm font-mono bg-white/20 px-2 py-1 rounded">
      Expires in: {timeLeft}
    </div>
  );
}
