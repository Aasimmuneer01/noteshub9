const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update MainLayout definition to accept settings
code = code.replace(
  "function MainLayout() {",
  "function MainLayout({ settings }: { settings: any }) {"
);

// Update route to pass settings
code = code.replace(
  "<Route path=\"*\" element={<MainLayout />} />",
  "<Route path=\"*\" element={<MainLayout settings={shutdownSettings} />} />"
);

// Update MainLayout to use settings
code = code.replace(
  "<MaintenanceCountdown settings={shutdownSettings} />",
  "<MaintenanceCountdown settings={settings} />"
);

fs.writeFileSync('src/App.tsx', code);
