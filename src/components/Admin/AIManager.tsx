import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface AIAssistantConfig {
    id: string;
    name: string;
    apiKey: string;
    provider: string;
    model: string;
    enabled: boolean;
    description: string;
    isNew?: boolean;
}

const AssistantCard = ({ 
    assistant, 
    onSave, 
    onDelete, 
    onCancelNew 
}: { key?: React.Key; 
    assistant: AIAssistantConfig; 
    onSave: (data: AIAssistantConfig) => Promise<void>; 
    onDelete: (id: string) => Promise<void>;
    onCancelNew: () => void;
}) => {
    const [formData, setFormData] = useState(assistant);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.name || !formData.apiKey || !formData.provider || !formData.model) {
            alert("Name, API Key, Provider, and Model are required.");
            return;
        }
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white mb-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Name</label>
                    <input 
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="e.g. Gemini"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input 
                        type="password"
                        value={formData.apiKey}
                        onChange={e => setFormData({...formData, apiKey: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 font-mono"
                        placeholder="•••••••••••••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input 
                        type="text"
                        value={formData.provider}
                        onChange={e => setFormData({...formData, provider: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="e.g. Google"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name/ID</label>
                    <input 
                        type="text"
                        value={formData.model}
                        onChange={e => setFormData({...formData, model: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="e.g. gemini-2.0-flash"
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select 
                        value={formData.enabled ? "Enabled" : "Disabled"}
                        onChange={e => setFormData({...formData, enabled: e.target.value === "Enabled"})}
                        className="border border-gray-300 rounded-lg p-1.5 text-sm font-medium"
                    >
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                    {assistant.isNew ? (
                        <button 
                            onClick={onCancelNew}
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button 
                            onClick={() => onDelete(assistant.id)}
                            className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export function AIManager() {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [assistants, setAssistants] = useState<AIAssistantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAssistants, setNewAssistants] = useState<AIAssistantConfig[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, 'ai_settings', 'status'));
      if (docSnap.exists()) {
        setGlobalEnabled(docSnap.data().enabled);
      }

      const assistantsSnap = await getDocs(collection(db, 'ai_assistants'));
      const fetchedAssistants = assistantsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      } as AIAssistantConfig));
      setAssistants(fetchedAssistants);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleGlobal = async () => {
    const newEnabled = !globalEnabled;
    await setDoc(doc(db, 'ai_settings', 'status'), { enabled: newEnabled }, { merge: true });
    setGlobalEnabled(newEnabled);
  };

  const handleAddClick = () => {
      setNewAssistants(prev => [{
          id: `temp-${Date.now()}`,
          name: '',
          apiKey: '',
          provider: 'Google',
          model: 'gemini-2.0-flash',
          enabled: true,
          description: '',
          isNew: true
      }, ...prev]);
  };

  const handleSave = async (data: AIAssistantConfig) => {
      try {
          if (data.isNew) {
              const { id, isNew, ...saveData } = data;
              const newDocRef = await addDoc(collection(db, 'ai_assistants'), {
                  ...saveData,
                  createdAt: serverTimestamp()
              });
              setAssistants(prev => [{ id: newDocRef.id, ...saveData }, ...prev]);
              setNewAssistants(prev => prev.filter(a => a.id !== data.id));
          } else {
              const { id, isNew, ...saveData } = data;
              await updateDoc(doc(db, 'ai_assistants', id), saveData as any);
              setAssistants(prev => prev.map(a => a.id === id ? { ...a, ...saveData } : a));
          }
      } catch (err) {
          console.error("Error saving assistant:", err);
          alert("Failed to save assistant.");
      }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this AI assistant?")) return;
      try {
          await deleteDoc(doc(db, 'ai_assistants', id));
          setAssistants(prev => prev.filter(a => a.id !== id));
      } catch (err) {
          console.error("Error deleting assistant:", err);
          alert("Failed to delete.");
      }
  };

  const handleCancelNew = (id: string) => {
      setNewAssistants(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-bold mb-4">Global AI Assistant Status</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleGlobal}
            className={`px-4 py-2 rounded-lg font-bold ${globalEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {globalEnabled ? 'Enabled' : 'Disabled'}
          </button>
          <p className="text-gray-600">
            The global AI feature is currently {globalEnabled ? 'enabled' : 'disabled'}.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold">AI Assistants</h2>
            <button 
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm"
            >
                <Plus size={18} /> Add AI Assistant
            </button>
        </div>

        <div className="max-w-xl">
            {newAssistants.map(assistant => (
                <AssistantCard 
                    key={assistant.id}
                    assistant={assistant}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onCancelNew={() => handleCancelNew(assistant.id)}
                />
            ))}

            {assistants.length === 0 && newAssistants.length === 0 ? (
                <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="mb-2">No AI assistants configured yet.</p>
                    <p className="text-sm">Click "+ Add AI Assistant" to set up your first model.</p>
                </div>
            ) : (
                assistants.map(assistant => (
                    <AssistantCard 
                        key={assistant.id}
                        assistant={assistant}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onCancelNew={() => {}}
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
}
