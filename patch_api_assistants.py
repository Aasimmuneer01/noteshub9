import re

with open('api/index.ts', 'r') as f:
    content = f.read()

new_route = """
app.get('/api/assistants', async (req, res) => {
    try {
        const db = getFirestore();
        const assistantsSnap = await db.collection('ai_assistants').where('enabled', '==', true).get();
        const assistants = [];
        assistantsSnap.forEach(doc => {
            const data = doc.data();
            assistants.push({
                id: doc.id,
                name: data.name,
                provider: data.provider,
                model: data.model,
                enabled: data.enabled
            });
        });
        res.json({ assistants });
    } catch (err) {
        console.error('Error fetching assistants:', err);
        res.status(500).json({ error: 'Failed to fetch assistants' });
    }
});

app.post('/api/chat', async (req, res) => {"""

if "/api/assistants" not in content:
    content = content.replace("app.post('/api/chat', async (req, res) => {", new_route)
    with open('api/index.ts', 'w') as f:
        f.write(content)
    print("Added /api/assistants route")
else:
    print("Already added")
