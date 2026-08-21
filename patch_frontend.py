import re

with open('src/pages/AIAssistant.tsx', 'r') as f:
    content = f.read()

# Replace the onSnapshot for ai_assistants with a fetch call

old_effect = """    const q = query(collection(db, 'ai_assistants'), where('enabled', '==', true));
    const unsubAssistants = onSnapshot(q, (snap) => {
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
    }, (error) => {
        console.error("Error fetching assistants:", error);
    });

    return () => {
        unsub();
        unsubAssistants();
    };"""

new_effect = """    const fetchAssistants = async () => {
        try {
            const res = await fetch('/api/assistants');
            if (res.ok) {
                const data = await res.json();
                const assistants = data.assistants || [];
                setAvailableAssistants(assistants);
                setSelectedAssistantId(prev => {
                    if (assistants.length > 0) {
                        if (!prev || !assistants.find((a: any) => a.id === prev)) {
                            return assistants[0].id;
                        }
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Error fetching assistants:", error);
        } finally {
            setLoadingAssistants(false);
        }
    };
    fetchAssistants();

    return () => {
        unsub();
    };"""

content = content.replace(old_effect, new_effect)

with open('src/pages/AIAssistant.tsx', 'w') as f:
    f.write(content)
print("Updated frontend")
