import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export function WebsiteControl() {
  const [settings, setSettings] = useState<any>(null);
  const [mode, setMode] = useState('Online');
  const [startTime, setStartTime] = useState('');
  const [restoreTime, setRestoreTime] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'website_control', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        setMode(data.mode || 'Online');
        if (data.startTime) setStartTime(data.startTime.toDate().toISOString().slice(0, 16));
        if (data.restoreTime) setRestoreTime(data.restoreTime.toDate().toISOString().slice(0, 16));
        setMessage(data.announcement || '');
      } else {
        // Initialize with default
        setSettings({ mode: 'Online' });
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const start = new Date(startTime);
    const restore = new Date(restoreTime);
    
    if (!isNaN(start.getTime()) && !isNaN(restore.getTime()) && start >= restore) {
        alert("Restore time must be after start time");
        return;
    }

    const docRef = doc(db, 'website_control', 'settings');
    const data = {
      mode,
      startTime: !isNaN(start.getTime()) ? Timestamp.fromDate(start) : null,
      restoreTime: !isNaN(restore.getTime()) ? Timestamp.fromDate(restore) : null,
      announcement: message,
      enabled: true
    };
    
    await setDoc(docRef, data, { merge: true });
    alert("Settings saved!");
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow border space-y-4">
      <h2 className="text-xl font-bold mb-4">Website Control</h2>
      
      <div>
        <label className="block text-sm font-medium">Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2 border rounded">
            <option value="Online">Online</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Shutdown">Shutdown</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border rounded"/>
        </div>
        <div>
            <label className="block text-sm font-medium">Restore Time</label>
            <input type="datetime-local" value={restoreTime} onChange={(e) => setRestoreTime(e.target.value)} className="w-full p-2 border rounded"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Announcement Message</label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2 border rounded"/>
      </div>

      <button onClick={handleSave} className="bg-primary text-white p-2 rounded">Save Schedule</button>
    </div>
  );
}
