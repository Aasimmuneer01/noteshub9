import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export function WebsiteControl() {
  const [settings, setSettings] = useState<any>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('Maintenance');
  const [startTime, setStartTime] = useState('');
  const [restoreTime, setRestoreTime] = useState('');
  const [message, setMessage] = useState('');

  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'website_control', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        setEnabled(!!data.enabled);
        setMode(data.mode || 'Maintenance');
        if (data.startTime) setStartTime(formatLocalDateTime(data.startTime.toDate()));
        if (data.restoreTime) setRestoreTime(formatLocalDateTime(data.restoreTime.toDate()));
        setMessage(data.announcement || '');
      } else {
        setSettings({ enabled: false, mode: 'Maintenance' });
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const start = new Date(startTime);
    const restore = new Date(restoreTime);
    
    if (!isNaN(start.getTime()) && !isNaN(restore.getTime()) && restore.getTime() <= start.getTime()) {
        alert("Restore time must be later than the start time.");
        return;
    }

    const docRef = doc(db, 'website_control', 'settings');
    const data = {
      enabled,
      mode,
      startTime: !isNaN(start.getTime()) ? Timestamp.fromDate(start) : null,
      restoreTime: !isNaN(restore.getTime()) ? Timestamp.fromDate(restore) : null,
      announcement: message
    };
    
    await setDoc(docRef, data, { merge: true });
    alert("Maintenance Schedule saved successfully!");
  };

  const nowMs = new Date().getTime();
  let startMs = startTime ? new Date(startTime).getTime() : 0;
  let restoreMs = restoreTime ? new Date(restoreTime).getTime() : 0;
  let isInvalid = startMs && restoreMs && restoreMs <= startMs;

  let schedStatus = 'Disabled';
  if (!enabled || (!startTime && !restoreTime)) {
    schedStatus = 'Disabled';
  } else if (isInvalid) {
    schedStatus = 'Invalid';
  } else if (startMs && nowMs < startMs) {
    schedStatus = 'Upcoming';
  } else if (startMs && restoreMs && nowMs >= startMs && nowMs < restoreMs) {
    schedStatus = 'Active';
  } else if (restoreMs && nowMs >= restoreMs) {
    schedStatus = 'Expired';
  }

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Maintenance Scheduler</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          schedStatus === 'Active' ? 'bg-red-100 text-red-700' :
          schedStatus === 'Upcoming' ? 'bg-yellow-100 text-yellow-700' :
          schedStatus === 'Expired' ? 'bg-gray-100 text-gray-700' :
          schedStatus === 'Invalid' ? 'bg-red-100 text-red-800' :
          'bg-green-100 text-green-700'
        }`}>
          Status: {schedStatus}
        </span>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input 
          type="checkbox" 
          id="schedulerEnabled" 
          checked={enabled} 
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="schedulerEnabled" className="text-sm font-medium text-gray-900 cursor-pointer">
          Enable Maintenance Schedule
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">
            <option value="Maintenance">Maintenance Mode</option>
            <option value="Shutdown">Shutdown Mode</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restore Date & Time</label>
            <input type="datetime-local" value={restoreTime} onChange={(e) => setRestoreTime(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Message</label>
        <input type="text" placeholder="e.g., Scheduled database upgrade in progress..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg"/>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg flex-1 transition-colors">Save Schedule</button>
        <button onClick={async () => {
          setEnabled(false);
          setStartTime('');
          setRestoreTime('');
          setMessage('');
          const docRef = doc(db, 'website_control', 'settings');
          await setDoc(docRef, {
            enabled: false,
            startTime: null,
            restoreTime: null,
            announcement: ''
          }, { merge: true });
          alert("Schedule cleared and disabled!");
        }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium p-2.5 rounded-lg px-4 transition-colors">Clear Schedule</button>
      </div>
    </div>
  );
}
