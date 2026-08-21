const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'api', 'index.ts');
let content = fs.readFileSync(p, 'utf8');

// Remove /api/assistants completely
content = content.replace(/app\.get\('\/api\/assistants'[\s\S]*?\}\);/, '');

// Fix /api/chat
content = content.replace(
    /app\.post\('\/api\/chat'[\s\S]*?res\.json\(\{ content: reply, provider \}\);\n\s*\} catch \(err\) \{/m,
    `app.post('/api/chat', async (req, res) => {
    try {
        const { messages, provider, model, systemInstruction } = req.body;
        let apiKey = process.env.GEMINI_API_KEY;
        let reply = "I'm sorry, I couldn't generate a response.";
        
        if (provider === 'OpenAI') {
            apiKey = process.env.OPENAI_API_KEY;
            const openai = new OpenAI({ apiKey });
            const completion = await openai.chat.completions.create({
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemInstruction || 'You are a helpful AI assistant for NotesHub9.' },
                    ...messages.map((m: any) => ({ role: m.role, content: m.content }))
                ]
            });
            reply = completion.choices[0].message.content || "";
        } else if (provider === 'Anthropic') {
            apiKey = process.env.ANTHROPIC_API_KEY;
            const anthropic = new Anthropic({ apiKey });
            const completion = await anthropic.messages.create({
                model: model || 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                system: systemInstruction || 'You are a helpful AI assistant for NotesHub9.',
                messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
            });
            reply = completion.content[0].type === 'text' ? completion.content[0].text : "";
        } else {
            apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI({ apiKey });
            const formattedMessages = messages.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            const response = await ai.models.generateContent({
                model: model || 'gemini-2.0-flash',
                contents: formattedMessages,
                config: {
                    systemInstruction: systemInstruction || 'You are a helpful AI assistant for NotesHub9.'
                }
            });
            reply = response.text || "";
        }
        
        res.json({ content: reply, provider });
    } catch (err) {`
);

fs.writeFileSync(p, content);
console.log("Patched api/index.ts");
