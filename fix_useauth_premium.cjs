const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.tsx', 'utf8');

const oldCode = `            const newUserData: UserType = {
              uid: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Student',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: authUser.email === 'admin@example.com' || authUser.email === 'aasimmuneer349@gmail.com' || authUser.email === 'admin@eduplatform.com' || authUser.email === 'mahnoor4999@gmail.com' ? 'admin' : 'user',
              isBanned: false,
              banReason: '',
              isPremium: globalFreePremium,
              premiumType: globalFreePremium ? 'global_free' : undefined,
              premiumStartDate: globalFreePremium ? now : undefined,
              premiumExpiryDate: globalFreePremium ? expiry : undefined,
              premiumNotificationShown: globalFreePremium ? false : undefined,
              emailVerified: authUser.emailVerified,
              verificationRequired: false,
              deviceFingerprint: fp,
              accountStatus: initialStatus,
              warningCount: 0,
              warnings: [],
              authProvider,
            };`;

const newCode = `            const newUserData: any = {
              uid: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Student',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: authUser.email === 'admin@example.com' || authUser.email === 'aasimmuneer349@gmail.com' || authUser.email === 'admin@eduplatform.com' || authUser.email === 'mahnoor4999@gmail.com' ? 'admin' : 'user',
              isBanned: false,
              banReason: '',
              isPremium: globalFreePremium,
              emailVerified: authUser.emailVerified,
              verificationRequired: false,
              deviceFingerprint: fp,
              accountStatus: initialStatus,
              warningCount: 0,
              warnings: [],
              authProvider,
            };
            if (globalFreePremium) {
                newUserData.premiumType = 'global_free';
                newUserData.premiumStartDate = Timestamp.fromDate(now);
                newUserData.premiumExpiryDate = Timestamp.fromDate(expiry);
                newUserData.premiumNotificationShown = false;
            }`;

code = code.replace(oldCode, newCode);
if (!code.includes('import { doc, getDoc')) {
   // verify
}
code = code.replace("import { auth, db } from '../firebase/config';", "import { auth, db } from '../firebase/config';\nimport { Timestamp } from 'firebase/firestore';");
fs.writeFileSync('src/hooks/useAuth.tsx', code);
