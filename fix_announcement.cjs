const fs = require('fs');
let code = fs.readFileSync('src/components/AnnouncementBar.tsx', 'utf8');

code = code.replace(
  `        setAnnouncement(null);\n      }\n    });\n    return unsub;`,
  `        setAnnouncement(null);\n      }\n    }, (error) => {\n      console.warn("Announcement listener error", error);\n    });\n    return unsub;`
);

fs.writeFileSync('src/components/AnnouncementBar.tsx', code);
