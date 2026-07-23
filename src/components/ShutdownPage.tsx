
import React from 'react';

interface ShutdownPageProps {
  status: 'Temporary' | 'Permanent' | 'Maintenance' | string;
  title: string;
  description: string;
  returnDate?: string;
  contactEmail?: string;
}

export default function ShutdownPage({ status, title, description, returnDate, contactEmail }: ShutdownPageProps) {
  const isMaintenance = status === 'Maintenance';
  const defaultTitle = isMaintenance ? 'Website Under Maintenance' : 'Website Unavailable';
  const defaultDescription = isMaintenance ? 'We are currently performing maintenance.\nPlease check back later.' : 'This website is currently undergoing maintenance. Please check back later.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background-main p-6 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-6xl">{isMaintenance ? '🛠️' : '🚧'}</div>
        <h1 className="text-3xl font-bold whitespace-pre-line">{title || defaultTitle}</h1>
        <p className="text-gray-400 whitespace-pre-line">{description || defaultDescription}</p>
        
        <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 text-left">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Status</p>
            <p className="font-bold">{isMaintenance ? 'Maintenance Mode' : `${status} Shutdown`}</p>
          </div>
          
          {returnDate && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Expected Return</p>
              <p className="font-bold">{new Date(returnDate).toLocaleDateString()}</p>
            </div>
          )}
          
          {contactEmail && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Support</p>
              <p className="font-bold">{contactEmail}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
