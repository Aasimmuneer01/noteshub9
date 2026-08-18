import React from 'react';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface AIAssistantConfig {
    id: string;
    name: string;
    apiKey: string;
    provider: string;
    model: string;
    enabled: boolean;
    description: string;
}

export function AIManager() {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [assistants, setAssistants] = useState<AIAssistantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<AIAssistantConfig>>({
      name: '',
      apiKey: '',
      provider: 'Google',
      model: '',
      enabled: true,
      description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch global status
      const docSnap = await getDoc(doc(db, 'ai_settings', 'status'));
      if (docSnap.exists()) {
        setGlobalEnabled(docSnap.data().enabled);
      }

      // Fetch AI assistants
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

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          if (editingId) {
              await updateDoc(doc(db, 'ai_assistants', editingId), formData as any);
              setAssistants(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } as AIAssistantConfig : a));
          } else {
              const newDocRef = await addDoc(collection(db, 'ai_assistants'), {
                  ...formData,
                  createdAt: serverTimestamp()
              });
              setAssistants(prev => [...prev, { id: newDocRef.id, ...formData } as AIAssistantConfig]);
          }
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', apiKey: '', provider: 'Google', model: '', enabled: true, description: '' });
      } catch (err) {
          console.error("Error saving assistant:", err);
          alert("Failed to save assistant.");
      }
      setLoading(false);
  };

  const handleEdit = (assistant: AIAssistantConfig) => {
      setFormData(assistant);
      setEditingId(assistant.id);
      setShowForm(true);
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this AI assistant?")) return;
      setLoading(true);
      try {
          await deleteDoc(doc(db, 'ai_assistants', id));
          setAssistants(prev => prev.filter(a => a.id !== id));
      } catch (err) {
          console.error("Error deleting assistant:", err);
      }
      setLoading(false);
  };

  const toggleAssistantStatus = async (id: string, currentStatus: boolean) => {
      try {
          const newStatus = !currentStatus;
          await updateDoc(doc(db, 'ai_assistants', id), { enabled: newStatus });
          setAssistants(prev => prev.map(a => a.id === id ? { ...a, enabled: newStatus } : a));
      } catch (err) {
          console.error("Error toggling status:", err);
      }
  };

  if (loading && assistants.length === 0 && !showForm) return <div className="p-4">Loading...</div>;

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
            The global AI Assistant feature is currently {globalEnabled ? 'enabled' : 'disabled'}.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">AI Assistants</h2>
            {!showForm && (
                <button 
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', apiKey: '', provider: 'Google', model: '', enabled: true, description: '' });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                    <Plus size={18} /> Add AI Assistant
                </button>
            )}
        </div>

        {showForm ? (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{editingId ? 'Edit AI Assistant' : 'Add New AI Assistant'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">AI Name</label>
                            <input 
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="e.g. Gemini, ChatGPT"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                            <input 
                                required
                                type="text"
                                value={formData.provider}
                                onChange={e => setFormData({...formData, provider: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="e.g. Google, OpenAI, Anthropic"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model Name/ID</label>
                            <input 
                                required
                                type="text"
                                value={formData.model}
                                onChange={e => setFormData({...formData, model: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="e.g. gemini-2.0-flash, gpt-4o"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                            <input 
                                required
                                type="password"
                                value={formData.apiKey}
                                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="••••••••••••••••"
                            />
                            <p className="text-xs text-gray-500 mt-1">Keys are stored securely in Firestore and only used server-side.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            rows={2}
                            placeholder="Brief description of this AI's purpose..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            id="enabled"
                            checked={formData.enabled}
                            onChange={e => setFormData({...formData, enabled: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Enabled</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {assistants.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                        No AI assistants configured yet. Click 'Add AI Assistant' to create one.
                    </div>
                ) : (
                    assistants.map(assistant => (
                        <div key={assistant.id} className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{assistant.name}</h3>
                                    <p className="text-sm text-gray-500">{assistant.provider} • {assistant.model}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${assistant.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {assistant.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">API Key</p>
                                    <p className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded truncate">
                                        {assistant.apiKey ? '••••••••••••' + assistant.apiKey.slice(-4) : 'Not set'}
                                    </p>
                                </div>
                                {assistant.description && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                                        <p className="text-sm text-gray-700 line-clamp-2">{assistant.description}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => toggleAssistantStatus(assistant.id, assistant.enabled)}
                                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg border transition-colors ${assistant.enabled ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'}`}
                                >
                                    {assistant.enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button 
                                    onClick={() => handleEdit(assistant)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Assistant"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(assistant.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Assistant"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
}
