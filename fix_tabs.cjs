const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /{activeTab === 'users'[\s\S]*?Feature '\{activeTab\}' coming soon.<\/div>\s*\)\}/;
const replacement = `{activeTab === 'users' && <UsersManager />}
      {activeTab === 'ai' && <AIManager />}
      {activeTab === 'announcements' && <AnnouncementsManager />}
      {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'ai' && activeTab !== 'announcements' && (
          <div className="p-8 text-center text-gray-500">Feature '{activeTab}' coming soon.</div>
      )}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
