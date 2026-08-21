import re

with open('api/index.ts', 'r') as f:
    content = f.read()

# Add imports for OpenAI and Anthropic
if "import OpenAI" not in content:
    content = content.replace("import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI } from '@google/genai';\nimport OpenAI from 'openai';\nimport Anthropic from '@anthropic-ai/sdk';")

start = content.find("if (provider.toLowerCase() === 'google' || provider.toLowerCase() === 'gemini') {")
end = content.find("} catch (err) {", start)

new_logic = """if (provider.toLowerCase() === 'google' || provider.toLowerCase() === 'gemini') {
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
        } else if (provider.toLowerCase() === 'openai' || provider.toLowerCase() === 'chatgpt') {
            const openai = new OpenAI({ apiKey });
            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemInstruction },
                    ...messages.map((m: any) => ({ role: m.role, content: m.content }))
                ]
            });
            const content = response.choices[0]?.message?.content || 'No response';
            return res.json({ content, provider });
        } else if (provider.toLowerCase() === 'anthropic' || provider.toLowerCase() === 'claude') {
            const anthropic = new Anthropic({ apiKey });
            
            // Format messages for Anthropic (only user/assistant roles allowed)
            const anthropicMessages = messages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
            
            const response = await anthropic.messages.create({
                model: model,
                system: systemInstruction,
                max_tokens: 1024,
                messages: anthropicMessages
            });
            const content = response.content[0]?.type === 'text' ? response.content[0].text : 'No response';
            return res.json({ content, provider });
        } else {
            return res.status(501).json({ error: `Provider ${provider} is not yet implemented in the backend.` });
        }
        
    """

content = content[:start] + new_logic + content[end:]

with open('api/index.ts', 'w') as f:
    f.write(content)
print("Updated api/index.ts")
