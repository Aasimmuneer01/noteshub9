const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const regexImport = /import { LogOut, User, Shield, Lock, Settings, ChevronRight } from 'lucide-react';/;
const replaceImport = `import { LogOut, User, Shield, Lock, Settings, ChevronRight, Crown, Calendar, Info, CreditCard } from 'lucide-react';
import { useEffect, useRef } from 'react';
import PremiumModal from '../components/PremiumModal';`;

code = code.replace(regexImport, replaceImport);

const regexHook = /const \[error, setError\] = useState\(''\);/;
const replaceHook = `const [error, setError] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const subscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === '#subscription' && subscriptionRef.current) {
      subscriptionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const getDaysRemaining = () => {
    if (userData?.premiumPlan === 'Lifetime' || userData?.premiumType === 'Lifetime') return 'Lifetime';
    const expiry = userData?.premiumExpiry || userData?.premiumExpiryDate;
    if (!expiry) return null;
    const expiryDate = expiry.toDate();
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getFormattedExpiry = () => {
    const expiry = userData?.premiumExpiry || userData?.premiumExpiryDate;
    if (!expiry) return 'N/A';
    return expiry.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
`;

code = code.replace(regexHook, replaceHook);


const regexContent = /<\/div>\s*<\/div>\s*\);/;
const replaceContent = `      <div ref={subscriptionRef} className="space-y-4 pt-4 border-t border-secondary">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          <CreditCard size={20} /> Subscription
        </h3>

        <div className="bg-surface p-6 rounded-2xl border border-secondary relative overflow-hidden">
           {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>}
           <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Current Plan</p>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className="text-xl font-bold text-white">
                        {isPremium ? (userData?.premiumPlan || 'Premium') : 'Free Plan'}
                      </h4>
                      {isPremium && <Crown size={18} className="text-yellow-500" />}
                    </div>
                  </div>
                  <div className={"px-3 py-1 rounded-full text-xs font-bold " + (isPremium ? (getDaysRemaining() === 0 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500") : "bg-gray-500/20 text-gray-400")}>
                    {isPremium ? (getDaysRemaining() === 0 ? 'Expired' : 'Active') : 'Free'}
                  </div>
              </div>

              {isPremium && (
                <div className="pt-4 border-t border-secondary/50 space-y-3">
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={16} /> Expiry Date
                      </div>
                      <span className="font-medium text-white">{getFormattedExpiry()}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Info size={16} /> Time Remaining
                      </div>
                      <span className="font-medium text-white">{getDaysRemaining()} {getDaysRemaining() === 'Lifetime' ? '' : 'Days'}</span>
                   </div>
                   {userData?.premiumType === 'global_free' && (
                     <div className="text-xs text-primary bg-primary/10 p-2 rounded-lg mt-2">
                        You have been granted temporary free premium access.
                     </div>
                   )}
                </div>
              )}

              <button
                onClick={() => setShowPremiumModal(true)}
                className={"w-full py-3 rounded-lg font-bold transition-all mt-4 " + (isPremium && getDaysRemaining() !== 0 ? "bg-surface-light border border-secondary text-white hover:bg-secondary" : "bg-primary text-white hover:bg-primary/90")}
              >
                {isPremium ? (getDaysRemaining() === 0 ? 'Renew Premium' : 'Manage Subscription') : 'Upgrade to Premium'}
              </button>
           </div>
        </div>
      </div>
      
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      </div>
    </div>
  );`;

code = code.replace(regexContent, replaceContent);
fs.writeFileSync('src/pages/Profile.tsx', code);
