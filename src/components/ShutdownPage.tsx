
import React from 'react';
import { AlertTriangle, Clock, Mail, ShieldAlert, Wrench } from 'lucide-react';

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

  const Icon = isMaintenance ? Wrench : (status === 'Permanent' ? ShieldAlert : AlertTriangle);
  const iconColor = isMaintenance ? 'text-blue-400' : (status === 'Permanent' ? 'text-red-500' : 'text-yellow-500');
  const bgColor = isMaintenance ? 'bg-blue-500/10' : (status === 'Permanent' ? 'bg-red-500/10' : 'bg-yellow-500/10');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 text-gray-100 p-6 text-center overflow-y-auto">
      <div className="max-w-md w-full space-y-8 my-8">
        <div className={`w-24 h-24 mx-auto rounded-3xl ${bgColor} flex items-center justify-center border border-white/5`}>
          <Icon className={`w-12 h-12 ${iconColor}`} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold whitespace-pre-line tracking-tight text-white">
            {title || defaultTitle}
          </h1>
          <p className="text-gray-400 whitespace-pre-line text-base sm:text-lg">
            {description || defaultDescription}
          </p>
        </div>
        
        <div className="bg-gray-900/90 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-gray-800 space-y-6 text-left shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
              <Icon className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Current Status</p>
              <p className="font-bold text-gray-100 text-lg">
                {isMaintenance ? 'Maintenance Mode' : `${status} Shutdown`}
              </p>
            </div>
          </div>
          
          {returnDate && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
              <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
                <Clock className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Expected Return</p>
                <p className="font-bold text-gray-100 text-lg">
                  {new Date(returnDate).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
          
          {contactEmail && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
              <div className="p-3.5 bg-gray-800 rounded-2xl border border-gray-700">
                <Mail className="w-6 h-6 text-gray-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Support Contact</p>
                <a href={`mailto:${contactEmail}`} className="font-bold text-blue-400 text-lg truncate block hover:underline">
                  {contactEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
