const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.tsx', 'utf8');

code = code.replace(
    /premiumExpiryDate: globalFreePremium \? expiry : undefined,/,
    "premiumExpiryDate: globalFreePremium ? expiry : undefined,\n              premiumNotificationShown: globalFreePremium ? false : undefined,"
);

fs.writeFileSync('src/hooks/useAuth.tsx', code);
