import re

with open('api/index.ts', 'r') as f:
    content = f.read()

if "import OpenAI" not in content:
    content = content.replace('import { GoogleGenAI } from "@google/genai";', 'import { GoogleGenAI } from "@google/genai";\nimport OpenAI from "openai";\nimport Anthropic from "@anthropic-ai/sdk";')
    with open('api/index.ts', 'w') as f:
        f.write(content)
    print("Fixed imports")
else:
    print("Already imported")
