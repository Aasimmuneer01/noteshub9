import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Edit2, Trash2, Plus, AlertTriangle, Info, Megaphone } from 'lucide-react';

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      text: currentAnnouncement.text,
      type: currentAnnouncement.type || 'Normal',
      enabled: currentAnnouncement.enabled ?? true,
      maintenanceDate: currentAnnouncement.maintenanceDate || null,
      updatedAt: serverTimestamp(),
    };

    if (currentAnnouncement.id) {
      await updateDoc(doc(db, 'announcements', currentAnnouncement.id), data);
    } else {
      await addDoc(collection(db, 'announcements'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
    setIsEditing(false);
    setCurrentAnnouncement(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      await deleteDoc(doc(db, 'announcements', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Broadcasts & Announcements</h2>
        <button 
          onClick={() => {
            setCurrentAnnouncement({ text: '', type: 'Normal', enabled: true, maintenanceDate: '' });
            setIsEditing(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {isEditing && currentAnnouncement && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Text</label>
            <input 
              required
              type="text" 
              className="w-full p-2 border rounded-lg"
              value={currentAnnouncement.text}
              onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, text: e.target.value})}
              placeholder="e.g., Important: New notes added..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={currentAnnouncement.type}
                onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, type: e.target.value})}
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input 
                  type="checkbox" 
                  checked={currentAnnouncement.enabled}
                  onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, enabled: e.target.checked})}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>
            </div>
          </div>

          {currentAnnouncement.type === 'Maintenance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Start Date/Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full p-2 border rounded-lg"
                value={currentAnnouncement.maintenanceDate}
                onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, maintenanceDate: e.target.value})}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button"
              onClick={() => { setIsEditing(false); setCurrentAnnouncement(null); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
            >
              Save Announcement
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${ann.enabled ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {ann.type === 'Important' ? <AlertTriangle size={16} className="text-orange-500" /> : 
                   ann.type === 'Maintenance' ? <AlertTriangle size={16} className="text-red-500" /> : 
                   <Megaphone size={16} className="text-blue-500" />}
                  <span className="text-sm font-bold text-gray-700">{ann.type}</span>
                  {!ann.enabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Disabled</span>}
                </div>
                <p className="text-gray-800">{ann.text}</p>
                {ann.type === 'Maintenance' && ann.maintenanceDate && (
                  <p className="text-sm text-red-500 mt-1 font-mono">Scheduled: {new Date(ann.maintenanceDate).toLocaleString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCurrentAnnouncement(ann); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(ann.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && !isEditing && (
          <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">
            No announcements found.
          </div>
        )}
      </div>
    </div>
  );
}
