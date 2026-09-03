import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export function WebsiteControl() {
  const [settings, setSettings] = useState<any>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'website_control', 'settings'));
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">Website Control</h2>
      <p>Current mode: {settings.mode || 'Online'}</p>
      {/* Add scheduling controls here */}
    </div>
  );
}
