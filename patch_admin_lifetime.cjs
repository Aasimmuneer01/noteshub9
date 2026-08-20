const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

code = code.replace(
  /const hasActivePremium = userData\.isPremium && \(userData\.premiumExpiry \|\| userData\.premiumExpiryDate\) && \(userData\.premiumExpiry \|\| userData\.premiumExpiryDate\)\.toDate\(\) > now;/,
  "const hasActivePremium = userData.isPremium && (userData.premiumPlan === 'Lifetime' || userData.premiumType === 'Lifetime' || ((userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumExpiry || userData.premiumExpiryDate).toDate() > now));"
);

fs.writeFileSync('admin.html', code);
