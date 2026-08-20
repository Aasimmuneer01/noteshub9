const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.tsx', 'utf8');

code = code.replace(
  /acceptTerms: \(\) => Promise<void>;/,
  "acceptTerms: () => Promise<void>;\n  acknowledgePremiumNotification: () => Promise<void>;"
);

code = code.replace(
  /acceptTerms: async \(\) => \{\},/,
  "acceptTerms: async () => {},\n  acknowledgePremiumNotification: async () => {},"
);

const acceptTermsImpl = `
  const acceptTerms = async () => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      termsAccepted: true,
      termsAcceptedAt: serverTimestamp(),
    });
  };

  const acknowledgePremiumNotification = async () => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      premiumNotificationShown: true,
    });
  };
`;

code = code.replace(
  /const acceptTerms = async \(\) => \{[\s\S]*?termsAcceptedAt: serverTimestamp\(\),\n    \}\);\n  \};/,
  acceptTermsImpl.trim()
);

code = code.replace(
  /acceptTerms,\n    acknowledgeWarning,/,
  "acceptTerms,\n    acknowledgePremiumNotification,\n    acknowledgeWarning,"
);

fs.writeFileSync('src/hooks/useAuth.tsx', code);
