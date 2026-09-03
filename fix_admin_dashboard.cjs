const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "import { AnnouncementsManager } from './Admin/AnnouncementsManager';",
  "import { AnnouncementsManager } from './Admin/AnnouncementsManager';\nimport { WebsiteControl } from './Admin/WebsiteControl';"
);

code = code.replace(
  "{activeTab === 'announcements' && <AnnouncementsManager />}\n      {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'ai' && activeTab !== 'announcements' && (",
  "{activeTab === 'announcements' && <AnnouncementsManager />}\n      {activeTab === 'website' && <WebsiteControl />}\n      {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'ai' && activeTab !== 'announcements' && activeTab !== 'website' && ("
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
