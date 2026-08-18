const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const oldRoute = /app\.post\('\/api\/chat', async \(req, res\) => \{[\s\S]*?\}\);\n\napp\.get\('\/api\/cron\/reply-emails'/;

const newRoute = `app.post('/api/chat', async (req, res) => {
    try {
        const { messages, assistantId } = req.body;
        
        let apiKey = process.env.GEMINI_API_KEY;
        let model = 'gemini-2.0-flash';
        let systemInstruction = "You are a helpful AI assistant for NotesHub9.";
        let provider = 'Google';

        if (assistantId) {
            const db = getFirestore();
            const assistantDoc = await db.collection('ai_assistants').doc(assistantId).get();
            if (assistantDoc.exists) {
                const config = assistantDoc.data();
                if (config && config.enabled) {
                    apiKey = config.apiKey || apiKey;
                    model = config.model || model;
                    systemInstruction = config.description || systemInstruction;
                    provider = config.provider || provider;
                } else if (config && !config.enabled) {
                     return res.status(403).json({ error: 'This AI assistant is currently disabled.' });
                }
            }
        }

        if (!apiKey) {
            return res.status(500).json({ error: "API_KEY not configured. Please configure an API key in the Admin Panel or environment variables." });
        }
        
        if (provider.toLowerCase() === 'google' || provider.toLowerCase() === 'gemini') {
            const dynamicAi = new GoogleGenAI({ 
                apiKey,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
            });
            const response = await dynamicAi.models.generateContent({
                model: model,
                contents: messages[messages.length - 1].content,
                config: {
                    systemInstruction: systemInstruction
                }
            });
            const content = response.text || 'No response';
            return res.json({ content, provider });
        } else {
            // Placeholder for other providers (OpenAI, Anthropic, etc.)
            // The architecture is now ready to support them server-side without exposing keys.
            return res.status(501).json({ error: \`Provider \${provider} is not yet implemented in the backend.\` });
        }
        
    } catch (err) {
        console.error('Error in chat:', err);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

app.get('/api/cron/reply-emails'`;

if (oldRoute.test(code)) {
    code = code.replace(oldRoute, newRoute);
    fs.writeFileSync('api/index.ts', code);
    console.log("Updated api/index.ts successfully.");
} else {
    console.log("Could not find the /api/chat route to replace.");
}
