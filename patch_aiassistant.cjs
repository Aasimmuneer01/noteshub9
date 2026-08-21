const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'pages', 'AIAssistant.tsx');
let content = fs.readFileSync(p, 'utf8');

// Replace the fetchAssistants logic with Firestore logic
content = content.replace(
    /const fetchAssistants = async \(\) => \{[\s\S]*?fetchAssistants\(\);/m,
    `const fetchAssistants = () => {
        setLoadingAssistants(true);
        const q = query(collection(db, 'ai_assistants'), where('enabled', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const assistants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        }, (error) => {
            console.error("Error fetching assistants:", error);
            setLoadingAssistants(false);
        });
        return unsubscribe;
    };
    const unsubscribeAssistants = fetchAssistants();`
);

content = content.replace(
    /return \(\) => \{\n\s*unsub\(\);\n\s*\};/,
    `return () => {
        unsub();
        if (unsubscribeAssistants) unsubscribeAssistants();
    };`
);

// Pass provider and model to /api/chat
content = content.replace(
    /body: JSON\.stringify\(\{[\s\S]*?assistantId: selectedAssistantId\n\s*\}\)/m,
    `body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            provider: availableAssistants.find(a => a.id === selectedAssistantId)?.provider || 'Google',
            model: availableAssistants.find(a => a.id === selectedAssistantId)?.model || 'gemini-2.0-flash',
            systemInstruction: availableAssistants.find(a => a.id === selectedAssistantId)?.description || 'You are a helpful AI assistant for NotesHub9.'
        })`
);

fs.writeFileSync(p, content);
console.log("Patched AIAssistant.tsx");
