import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { Power, ShieldAlert, Wrench, Globe, CheckCircle2, Clock, Sparkles, AlertTriangle } from 'lucide-react';

export function WebsiteControl() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [mode, setMode] = useState<'Online' | 'Maintenance' | 'Shutdown'>('Online');
  const [shutdownManual, setShutdownManual] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [restoreTime, setRestoreTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [globalFreePremium, setGlobalFreePremium] = useState(false);

  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const docRef = doc(db, 'website_control', 'settings');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        const currentMode = (data.mode as 'Online' | 'Maintenance' | 'Shutdown') || (data.shutdownManual || data.shutdownEnabled ? 'Shutdown' : 'Online');
        setMode(currentMode);
        setShutdownManual(!!data.shutdownManual || !!data.shutdownEnabled || (currentMode === 'Shutdown' && !data.enabled));
        setScheduleEnabled(!!data.enabled);
        if (data.startTime) setStartTime(formatLocalDateTime(data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime)));
        if (data.restoreTime) setRestoreTime(formatLocalDateTime(data.restoreTime.toDate ? data.restoreTime.toDate() : new Date(data.restoreTime)));
        setTitle(data.title || '');
        setDescription(data.description || '');
        setReturnDate(data.returnDate || '');
        setContactEmail(data.contactEmail || '');
        setAnnouncement(data.announcement || '');
        setGlobalFreePremium(!!data.globalFreePremium);
      } else {
        setSettings({ mode: 'Online', enabled: false, shutdownManual: false });
        setMode('Online');
        setShutdownManual(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("WebsiteControl listener error:", error);
      setFeedback({ type: 'error', message: 'Failed to listen to website control settings: ' + error.message });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Immediate Manual Shutdown Mode Toggle (ON / OFF)
  const handleToggleManualShutdown = async (targetState: boolean) => {
    setSaving(true);
    try {
      const docRef = doc(db, 'website_control', 'settings');
      if (targetState) {
        // Turn Shutdown ON
        await setDoc(docRef, {
          mode: 'Shutdown',
          shutdownManual: true,
          shutdownEnabled: true,
          isShutdown: true,
          title: title || 'Website Unavailable',
          description: description || 'This website is currently undergoing maintenance. Please check back later.',
          contactEmail: contactEmail || 'support@noteshub9.com'
        }, { merge: true });
        showToast('success', 'Shutdown Mode is now turned ON! Public website is blocked.');
      } else {
        // Turn Shutdown OFF (Restore Live Site)
        await setDoc(docRef, {
          mode: 'Online',
          shutdownManual: false,
          shutdownEnabled: false,
          isShutdown: false,
          enabled: false
        }, { merge: true });
        showToast('success', 'Shutdown Mode is now turned OFF! Website is live and accessible.');
      }
    } catch (err: any) {
      console.error("Error toggling shutdown mode:", err);
      showToast('error', 'Failed to update Shutdown Mode: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Immediate Manual Maintenance Mode Toggle (ON / OFF)
  const handleToggleManualMaintenance = async (targetState: boolean) => {
    setSaving(true);
    try {
      const docRef = doc(db, 'website_control', 'settings');
      if (targetState) {
        await setDoc(docRef, {
          mode: 'Maintenance',
          shutdownManual: false,
          shutdownEnabled: false,
          isShutdown: false,
          maintenanceManual: true,
          title: title || 'Website Under Maintenance',
          description: description || 'We are currently performing maintenance. Please check back later.',
          contactEmail: contactEmail || 'support@noteshub9.com'
        }, { merge: true });
        showToast('success', 'Maintenance Mode is now turned ON.');
      } else {
        await setDoc(docRef, {
          mode: 'Online',
          shutdownManual: false,
          shutdownEnabled: false,
          isShutdown: false,
          maintenanceManual: false,
          enabled: false
        }, { merge: true });
        showToast('success', 'Maintenance Mode is now turned OFF! Website is live.');
      }
    } catch (err: any) {
      console.error("Error toggling maintenance mode:", err);
      showToast('error', 'Failed to update Maintenance Mode: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save all custom settings & schedule
  const handleSaveAllSettings = async () => {
    setSaving(true);
    try {
      const start = startTime ? new Date(startTime) : null;
      const restore = restoreTime ? new Date(restoreTime) : null;
      
      if (scheduleEnabled && start && restore && !isNaN(start.getTime()) && !isNaN(restore.getTime()) && restore.getTime() <= start.getTime()) {
        showToast('error', 'Restore date/time must be later than start date/time.');
        setSaving(false);
        return;
      }

      const docRef = doc(db, 'website_control', 'settings');
      const data: any = {
        mode,
        shutdownManual: mode === 'Shutdown' && !scheduleEnabled,
        shutdownEnabled: mode === 'Shutdown' && !scheduleEnabled,
        isShutdown: mode === 'Shutdown' && !scheduleEnabled,
        enabled: scheduleEnabled,
        startTime: start && !isNaN(start.getTime()) ? Timestamp.fromDate(start) : null,
        restoreTime: restore && !isNaN(restore.getTime()) ? Timestamp.fromDate(restore) : null,
        title,
        description,
        returnDate,
        contactEmail,
        announcement,
        globalFreePremium
      };
      
      await setDoc(docRef, data, { merge: true });
      showToast('success', 'Website control settings saved successfully!');
    } catch (err: any) {
      console.error("Save error:", err);
      showToast('error', 'Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Clear schedule
  const handleClearSchedule = async () => {
    setSaving(true);
    try {
      setScheduleEnabled(false);
      setStartTime('');
      setRestoreTime('');
      const docRef = doc(db, 'website_control', 'settings');
      await setDoc(docRef, {
        enabled: false,
        startTime: null,
        restoreTime: null
      }, { merge: true });
      showToast('success', 'Maintenance schedule cleared!');
    } catch (err: any) {
      showToast('error', 'Failed to clear schedule: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span>Loading Website Control...</span>
      </div>
    );
  }

  // Active status calculations
  const nowMs = Date.now();
  let startMs = startTime ? new Date(startTime).getTime() : 0;
  let restoreMs = restoreTime ? new Date(restoreTime).getTime() : 0;
  let isInvalid = startMs && restoreMs && restoreMs <= startMs;

  const isScheduleActive = scheduleEnabled && startMs && restoreMs && nowMs >= startMs && nowMs < restoreMs;
  const isScheduleUpcoming = scheduleEnabled && startMs && nowMs < startMs;
  
  const isCurrentlyShutdown = (mode === 'Shutdown' && !scheduleEnabled) || (isScheduleActive && mode === 'Shutdown') || shutdownManual;
  const isCurrentlyMaintenance = !isCurrentlyShutdown && ((mode === 'Maintenance' && !scheduleEnabled) || (isScheduleActive && mode === 'Maintenance'));
  const isCurrentlyOnline = !isCurrentlyShutdown && !isCurrentlyMaintenance;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="font-semibold text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Main Status Header Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isCurrentlyShutdown
          ? 'bg-red-900/10 border-red-500/30 text-red-900'
          : isCurrentlyMaintenance
          ? 'bg-amber-900/10 border-amber-500/30 text-amber-900'
          : 'bg-emerald-900/10 border-emerald-500/30 text-emerald-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
              isCurrentlyShutdown
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : isCurrentlyMaintenance
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}>
              {isCurrentlyShutdown ? <ShieldAlert className="w-7 h-7" /> : isCurrentlyMaintenance ? <Wrench className="w-7 h-7" /> : <Globe className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Website Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isCurrentlyShutdown
                    ? 'bg-red-100 text-red-700'
                    : isCurrentlyMaintenance
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  ● {isCurrentlyShutdown ? 'Shutdown Active' : isCurrentlyMaintenance ? 'Maintenance Active' : 'Live & Online'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mt-1">
                {isCurrentlyShutdown
                  ? 'Website is in Shutdown Mode'
                  : isCurrentlyMaintenance
                  ? 'Website is in Maintenance Mode'
                  : 'NotesHub9 is Live and Accessible'}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {isCurrentlyShutdown
                  ? 'Public website navigation is blocked. Visitors see the Shutdown screen.'
                  : isCurrentlyMaintenance
                  ? 'Public website is restricted. Maintenance screen or notice is displayed.'
                  : 'All public and authenticated services are running normally.'}
              </p>
            </div>
          </div>

          {/* Quick Instant Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isCurrentlyShutdown ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleManualShutdown(false)}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Power className="w-4 h-4" />
                Turn Shutdown OFF (Restore Site)
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleManualShutdown(true)}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Power className="w-4 h-4" />
                Turn Shutdown ON
              </button>
            )}

            {isCurrentlyMaintenance ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleManualMaintenance(false)}
                className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Turn Maintenance OFF
              </button>
            ) : !isCurrentlyShutdown ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleManualMaintenance(true)}
                className="px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Turn Maintenance ON
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Manual Mode Selection & Customization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Manual Mode Control */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Power className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Manual Website Mode Control</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Active Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('Online')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                    mode === 'Online'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-400/20'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Online (Normal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('Maintenance')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                    mode === 'Maintenance'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-2 ring-amber-400/20'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Maintenance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('Shutdown')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                    mode === 'Shutdown'
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-sm ring-2 ring-red-400/20'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Shutdown Mode</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Shutdown / Maintenance Custom Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., NotesHub9 is Temporarily Offline"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Shutdown / Maintenance Message</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., We are performing essential database and server upgrades. We will be back shortly!"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="noteshub9.official@gmail.com"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Top Announcement Banner Text</label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g., Scheduled maintenance warning shown at top of website"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Maintenance & Shutdown Scheduler */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Maintenance & Shutdown Scheduler</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isScheduleActive ? 'bg-red-100 text-red-700' :
                isScheduleUpcoming ? 'bg-amber-100 text-amber-700' :
                scheduleEnabled ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {isScheduleActive ? 'Active Now' : isScheduleUpcoming ? 'Upcoming' : scheduleEnabled ? 'Scheduled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <input
                type="checkbox"
                id="scheduleEnabled"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="scheduleEnabled" className="text-sm font-bold text-gray-900 cursor-pointer">
                Enable Automated Schedule (Auto Start & Restore)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Restore Date & Time</label>
                <input
                  type="datetime-local"
                  value={restoreTime}
                  onChange={(e) => setRestoreTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {isInvalid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                ⚠️ Warning: Restore time must be after the start time.
              </div>
            )}

            {/* Global Free Premium Quick Feature */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Global Free Premium Access</h4>
                  <p className="text-xs text-gray-500">Grant free access to premium tools for all users</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalFreePremium}
                  onChange={(e) => setGlobalFreePremium(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAllSettings}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : 'Save All Website Settings'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleClearSchedule}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              Clear Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

