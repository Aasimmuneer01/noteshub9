const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.tsx', 'utf8');
code = code.replace(
  /if \(userData\?\.isPremium && userData\.premiumExpiry && userData\.premiumPlan !== 'Lifetime'\)/,
  "if (userData?.isPremium && (userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumPlan !== 'Lifetime' && userData.premiumType !== 'Lifetime'))"
);
fs.writeFileSync('src/hooks/useAuth.tsx', code);
