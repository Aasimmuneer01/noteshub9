import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function AIManager() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const docSnap = await getDoc(doc(db, 'ai_settings', 'status'));
      if (docSnap.exists()) {
        setEnabled(docSnap.data().enabled);
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const toggle = async () => {
    const newEnabled = !enabled;
    await setDoc(doc(db, 'ai_settings', 'status'), { enabled: newEnabled });
    setEnabled(newEnabled);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">AI Assistant Status</h2>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggle}
          className={`px-4 py-2 rounded-lg font-bold ${enabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
        <p className="text-gray-600">
          The AI Assistant is currently {enabled ? 'enabled' : 'disabled'}.
        </p>
      </div>
    </div>
  );
}
