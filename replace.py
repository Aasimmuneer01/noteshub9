import re

with open('src/components/Admin/AIManager.tsx', 'r') as f:
    content = f.read()

# I want to rewrite from "const AssistantCard = ({" to "};" before "export function AIManager()"
start = content.find("const AssistantCard = ({")
end = content.find("export function AIManager()")

if start != -1 and end != -1:
    new_component = """const AssistantCard = ({ 
    assistant, 
    onChange,
    onSave, 
    onDelete, 
    onCancelNew 
}: { 
    key?: React.Key; 
    assistant: AIAssistantConfig; 
    onChange: (data: AIAssistantConfig) => void;
    onSave: (data: AIAssistantConfig) => Promise<void>; 
    onDelete: (id: string) => Promise<void>;
    onCancelNew: () => void;
}) => {
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(assistant.isNew || false);
    const [editData, setEditData] = useState(assistant);

    const handleSave = async () => {
        if (!editData.name || !editData.apiKey || !editData.provider || !editData.model) {
            alert("Name, API Key, Provider, and Model are required.");
            return;
        }
        setSaving(true);
        try {
            await onSave(editData);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{assistant.name}</h3>
                    <button 
                        onClick={async () => {
                            const updated = {...assistant, enabled: !assistant.enabled};
                            onChange(updated);
                            if (!assistant.isNew) {
                                try {
                                    // Make sure db is imported properly - it is in this file
                                    // We need to just update state and notify via onChange, wait, the parent handleUpdate will set state
                                    // The instruction says "Update the SAME Firestore document"
                                    // I'll assume we can call an update directly or just let handleSave do it.
                                    // It's cleaner to have a toggle function, but we can do it inline.
                                    const { doc, updateDoc } = require('firebase/firestore');
                                    const { db } = require('../../firebase/config');
                                    await updateDoc(doc(db, 'ai_assistants', assistant.id), { enabled: updated.enabled });
                                } catch (e) {
                                    console.error("Failed to toggle status", e);
                                    alert("Failed to toggle status");
                                    onChange(assistant); // Revert on failure
                                }
                            }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${assistant.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {assistant.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="space-y-2 text-sm text-gray-700 mb-6">
                    <p><span className="font-semibold text-gray-900 w-20 inline-block">Provider:</span> {assistant.provider}</p>
                    <p><span className="font-semibold text-gray-900 w-20 inline-block">Model:</span> {assistant.model}</p>
                    <p><span className="font-semibold text-gray-900 w-20 inline-block">Status:</span> {assistant.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => {
                            setEditData(assistant);
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-100"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={async () => {
                            const updated = {...assistant, enabled: !assistant.enabled};
                            onChange(updated);
                            if (!assistant.isNew) {
                                try {
                                    const { doc, updateDoc } = require('firebase/firestore');
                                    const { db } = require('../../firebase/config');
                                    await updateDoc(doc(db, 'ai_assistants', assistant.id), { enabled: updated.enabled });
                                } catch (e) {
                                    console.error("Failed to toggle status", e);
                                    alert("Failed to toggle status");
                                    onChange(assistant);
                                }
                            }
                        }}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200"
                    >
                        {assistant.enabled ? 'Disable' : 'Enable'}
                    </button>

                    {confirmDelete ? (
                        <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-lg border border-red-100">
                             <span className="text-sm font-bold text-red-800 ml-2">Delete this assistant?</span>
                             <button 
                                onClick={() => {
                                    setConfirmDelete(false);
                                    onDelete(assistant.id);
                                }}
                                className="bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700 text-sm ml-2"
                            >
                                Yes
                            </button>
                            <button 
                                onClick={() => setConfirmDelete(false)}
                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded font-bold hover:bg-gray-300 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white mb-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Name</label>
                    <input 
                        type="text"
                        style={{ color: '#000000' }}
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        className="w-full border border-gray-400 rounded-lg p-2 bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Gemini"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input 
                        type="password"
                        style={{ color: '#000000' }}
                        value={editData.apiKey}
                        onChange={e => setEditData({...editData, apiKey: e.target.value})}
                        className="w-full border border-gray-400 rounded-lg p-2 font-mono bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="•••••••••••••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input 
                        type="text"
                        style={{ color: '#000000' }}
                        value={editData.provider}
                        onChange={e => setEditData({...editData, provider: e.target.value})}
                        className="w-full border border-gray-400 rounded-lg p-2 bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Google"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name/ID</label>
                    <input 
                        type="text"
                        style={{ color: '#000000' }}
                        value={editData.model}
                        onChange={e => setEditData({...editData, model: e.target.value})}
                        className="w-full border border-gray-400 rounded-lg p-2 bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. gemini-2.0-flash"
                    />
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <button 
                        onClick={() => setEditData({...editData, enabled: !editData.enabled})}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${editData.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {editData.enabled ? 'ON' : 'OFF'}
                    </button>
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
                    <button 
                        onClick={() => {
                            if (assistant.isNew) {
                                onCancelNew();
                            } else {
                                setIsEditing(false);
                                setEditData(assistant);
                            }
                        }}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

"""
    new_content = content[:start] + new_component + content[end:]
    
    # Also update handleDelete to show error
    new_content = new_content.replace(
        'console.error("Error deleting assistant:", err);',
        'console.error("Error deleting assistant:", err);\n          alert("Failed to delete assistant. Error: " + (err.message || "Unknown error"));'
    )
    
    with open('src/components/Admin/AIManager.tsx', 'w') as f:
        f.write(new_content)
    print("Updated successfully")
else:
    print("Could not find boundaries")
