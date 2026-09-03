const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /\/\/ Fetch AI Assistants\s*const aiSettingsRef[\s\S]*?setEnabledAssistants\(config\.assistants\.filter\(\(a: any\) => a\.enabled\)\);\s*\}\s*\}/;
const replacement = `// Fetch AI Assistants
        try {
          const aiSettingsRef = doc(db, 'ai_settings', 'config');
          const aiSnap = await getDoc(aiSettingsRef);
          if (aiSnap.exists()) {
            const config = aiSnap.data();
            if (config.assistants) {
              setEnabledAssistants(config.assistants.filter((a: any) => a.enabled));
            }
          }
        } catch (e) {
          console.warn("Could not fetch AI assistants:", e);
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/Home.tsx', code);
