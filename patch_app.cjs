const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("PremiumNotificationPopup")) {
  code = code.replace(
    /import TermsAcceptanceDialog from '.\/components\/TermsAcceptanceDialog';/,
    "import TermsAcceptanceDialog from './components/TermsAcceptanceDialog';\nimport PremiumNotificationPopup from './components/PremiumNotificationPopup';"
  );
}

code = code.replace(
  /const \{ user, loading, verificationBlocked, userData, acceptTerms, acknowledgeWarning, logout \} = useAuth\(\);/,
  "const { user, loading, verificationBlocked, userData, acceptTerms, acknowledgePremiumNotification, acknowledgeWarning, logout } = useAuth();"
);

code = code.replace(
  /if \(user && !termsAccepted && location\.pathname !== '\/terms'\) \{[\s\S]*?return <TermsAcceptanceDialog onAccept=\{acceptTerms\} onDecline=\{logout\} \/>;\n  \}/,
  `if (user && !termsAccepted && location.pathname !== '/terms') {
    return <TermsAcceptanceDialog onAccept={acceptTerms} onDecline={logout} />;
  }

  if (user && termsAccepted && userData?.isPremium && userData?.premiumType === 'global_free' && !userData?.premiumNotificationShown && location.pathname !== '/terms') {
    return <PremiumNotificationPopup onAcknowledge={acknowledgePremiumNotification} />;
  }`
);

fs.writeFileSync('src/App.tsx', code);
