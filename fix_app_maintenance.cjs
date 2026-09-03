const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import ShutdownPage from './components/ShutdownPage';",
  "import ShutdownPage from './components/ShutdownPage';\nimport { MaintenanceCountdown } from './components/MaintenanceCountdown';"
);

// Modify App function for maintenance logic
code = code.replace(
  "const isShutdown = shutdownSettings && (shutdownSettings.mode ? shutdownSettings.mode !== 'Online' : !shutdownSettings.enabled);",
  `
  const now = new Date();
  const startTime = shutdownSettings?.startTime?.toDate();
  const restoreTime = shutdownSettings?.restoreTime?.toDate();
  const isMaintenanceMode = (shutdownSettings?.mode === 'Maintenance' || shutdownSettings?.mode === 'Shutdown') && 
                            startTime && now >= startTime && 
                            (!restoreTime || now < restoreTime);
  const isShutdown = isMaintenanceMode;
  `
);

// Add the countdown to MainLayout
code = code.replace(
  "<UnreadNotification />",
  "<MaintenanceCountdown settings={shutdownSettings} />\n      <UnreadNotification />"
);

fs.writeFileSync('src/App.tsx', code);
