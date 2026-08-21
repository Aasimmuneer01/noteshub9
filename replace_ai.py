import re

with open('src/pages/AIAssistant.tsx', 'r') as f:
    content = f.read()

# Add loadingAssistants state
if "const [loadingAssistants, setLoadingAssistants]" not in content:
    content = content.replace("const [availableAssistants, setAvailableAssistants] = useState<AIAssistantConfig[]>([]);", 
                              "const [availableAssistants, setAvailableAssistants] = useState<AIAssistantConfig[]>([]);\n  const [loadingAssistants, setLoadingAssistants] = useState(true);")

# Update onSnapshot to set loadingAssistants to false
old_snapshot = """const unsubAssistants = onSnapshot(q, (snap) => {
        const assistants = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIAssistantConfig));
        setAvailableAssistants(assistants);
        setSelectedAssistantId(prev => {
            if (assistants.length > 0) {
                if (!prev || !assistants.find(a => a.id === prev)) {
                    return assistants[0].id;
                }
            }
            return prev;
        });
    }, (error) => {"""

new_snapshot = """const unsubAssistants = onSnapshot(q, (snap) => {
        const assistants = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIAssistantConfig));
        setAvailableAssistants(assistants);
        setSelectedAssistantId(prev => {
            if (assistants.length > 0) {
                if (!prev || !assistants.find(a => a.id === prev)) {
                    return assistants[0].id;
                }
            }
            return prev;
        });
        setLoadingAssistants(false);
    }, (error) => {"""
content = content.replace(old_snapshot, new_snapshot)

# Update render logic to handle no assistants
old_render = """if (!aiEnabled) {
    return (
        <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow border border-gray-200 mt-20">"""

new_render = """if (loadingAssistants) {
    return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!aiEnabled) {
    return (
        <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow border border-gray-200 mt-20">"""

content = content.replace(old_render, new_render)

old_no_assistants = """</a>
            </p>
        </div>
    );
  }"""

new_no_assistants = """</a>
            </p>
        </div>
    );
  }

  if (availableAssistants.length === 0) {
    return (
        <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow border border-gray-200 mt-20">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No AI Assistants Available</h2>
            <p className="text-gray-600 mb-4">
                There are no AI assistants currently enabled or configured. Please contact the administrator.
            </p>
            <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                Return Home
            </button>
        </div>
    );
  }"""

content = content.replace(old_no_assistants, new_no_assistants)

with open('src/pages/AIAssistant.tsx', 'w') as f:
    f.write(content)
print("Updated src/pages/AIAssistant.tsx")
