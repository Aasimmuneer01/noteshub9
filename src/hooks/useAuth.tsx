import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User as UserType } from '../types';

export function getDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ].join('###');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserType | null;
  isPremium: boolean;
  loading: boolean;
  bannedMessage: string | null;
  verificationBlocked: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  verifyOTP: (code: string) => Promise<boolean>;
  clearBannedMessage: () => void;
  changePassword: (newPass: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
  acknowledgeWarning: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isPremium: false,
  loading: true,
  bannedMessage: null,
  verificationBlocked: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resendVerification: async () => {},
  verifyOTP: async () => false,
  clearBannedMessage: () => {},
  changePassword: async () => {},
  acceptTerms: async () => {},
  acknowledgeWarning: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannedMessage, setBannedMessage] = useState<string | null>(null);
  const [verificationBlocked, setVerificationBlocked] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Derive isPremium
  useEffect(() => {
    const checkPremium = () => {
      if (!userData) {
        setIsPremium(false);
        return;
      }

      // Admins/mods are always premium
      const isAdmin = ['admin', 'superadmin', 'moderator'].includes(userData.role || '');
      if (isAdmin) {
        setIsPremium(true);
        return;
      }

      if (!userData.isPremium) {
        setIsPremium(false);
        return;
      }

      if (userData.premiumPlan === 'Lifetime') {
        setIsPremium(true);
        return;
      }

      if (userData.premiumExpiry) {
        const expiry = userData.premiumExpiry.toDate();
        const active = new Date() < expiry;
        setIsPremium(active);
        return;
      }

      setIsPremium(false);
    };

    checkPremium();
    
    // Set up a timer if it's premium and has an expiry
    let timer: NodeJS.Timeout;
    if (userData?.isPremium && userData.premiumExpiry && userData.premiumPlan !== 'Lifetime') {
      const expiry = userData.premiumExpiry.toDate().getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff > 0) {
        // Schedule a check when it expires
        timer = setTimeout(() => {
          checkPremium();
        }, diff + 1000); // 1s buffer
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [userData, user]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (!authUser) {
        setUser(null);
        setUserData(null);
        setVerificationBlocked(false);
        setLoading(false);
        return;
      }

      setUser(authUser);
      const fp = getDeviceFingerprint();
      const userDocRef = doc(db, 'users', authUser.uid);

      const fetchUserDoc = async (retries = 3): Promise<void> => {
        try {
          console.log('Fetching user doc for:', authUser.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            console.log('Creating new user document for:', authUser.uid);
            let initialStatus = 'active';
            try {
              const bannedFpSnap = await getDoc(doc(db, 'bannedFingerprints', fp));
              if (bannedFpSnap.exists()) initialStatus = 'suspicious';
            } catch (err) {
              console.warn('Could not check banned fingerprints:', err);
            }

            const newUserData: UserType = {
              uid: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Student',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: authUser.email === 'admin@example.com' || authUser.email === 'aasimmuneer349@gmail.com' || authUser.email === 'admin@eduplatform.com' || authUser.email === 'mahnoor4999@gmail.com' ? 'admin' : 'user',
              isBanned: false,
              banReason: '',
              isPremium: false,
              emailVerified: authUser.emailVerified,
              verificationRequired: false,
              deviceFingerprint: fp,
              accountStatus: initialStatus,
              warningCount: 0,
              warnings: [],
            };

            await setDoc(userDocRef, newUserData);
            console.log('User document created successfully');
          } else {
            console.log('Updating last login for:', authUser.uid);
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp(),
              deviceFingerprint: fp,
              emailVerified: authUser.emailVerified,
            });
          }
        } catch (err: any) {
          console.error("Error in fetchUserDoc:", err);
          if (retries > 0 && err.message?.includes('offline')) {
             console.warn('Firestore offline, retrying...');
             await new Promise(r => setTimeout(r, 2000));
             return fetchUserDoc(retries - 1);
          }
        }
      };

      await fetchUserDoc();

      // Realtime snapshot listener on user doc
      unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserType;
          setUserData(data);

          // Ban check
          if (data.isBanned) {
            let isStillBanned = true;
            if (data.banUntil) {
              const banUntilTime = Date.parse(data.banUntil);
              if (Date.now() > banUntilTime) {
                isStillBanned = false;
                // Automatically unban
                await updateDoc(userDocRef, {
                    isBanned: false,
                    banReason: '',
                    banUntil: null
                });
              }
            }

            if (isStillBanned) {
              let msg = data.banReason || "You have been banned from using any material on this website.";
              if (data.banUntil) {
                const banUntilTime = Date.parse(data.banUntil);
                const now = Date.now();
                const diff = banUntilTime - now;
                console.log("DEBUG BAN:", { banUntil: data.banUntil, banUntilTime, now, diff });

                if (diff > 0) {
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  msg += ` Ban ends in ${hours}h ${minutes}m.`;
                }
              }
              msg += `\n\nBanned email: ${data.email}\nStudent name: ${data.displayName}`;
              setBannedMessage(msg);
              await signOut(auth);
              setUser(null);
              setUserData(null);
              setLoading(false);
              return;
            }
          }

          // Automatic Premium Expiry Check
          if (data.isPremium && data.premiumExpiry && data.premiumPlan !== 'Lifetime') {
            const expiry = data.premiumExpiry.toDate();
            if (new Date() >= expiry) {
              console.log("Premium expired for user:", authUser.uid);
              // Local update happens automatically via checkPremium derived state
            }
          }

          // Verification check (Support both Firebase and Custom OTP)
          if (data.verificationRequired && !authUser.emailVerified && !data.emailVerified && !data.isEmailVerified) {
            setVerificationBlocked(true);
          } else {
            setVerificationBlocked(false);
          }
        }
        setLoading(false);
      }, (err) => {
        console.error("User snapshot err:", err);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      // Trigger initial OTP send
      await resendVerification();
    }
  };

  const logout = async () => {
    await signOut(auth);
    setBannedMessage(null);
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Firestore
    await setDoc(doc(db, 'otps', auth.currentUser.uid), {
      code,
      email: auth.currentUser.email,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Call server API to "send" email (Simulated)
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, code })
      });
    } catch (err) {
      console.error("Failed to call send-otp API:", err);
    }
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
    if (!auth.currentUser) return false;

    const otpDoc = await getDoc(doc(db, 'otps', auth.currentUser.uid));
    if (!otpDoc.exists()) return false;

    const data = otpDoc.data();
    const now = new Date();
    
    if (data.code === code && data.expiresAt.toDate() > now) {
      // Success! Update user doc
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        isEmailVerified: true,
        emailVerified: true // Also update our custom field
      });

      // Cleanup
      await deleteDoc(doc(db, 'otps', auth.currentUser.uid));
      return true;
    }

    return false;
  };

  const changePassword = async (newPass: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updatePassword(auth.currentUser, newPass);
  };

  const acceptTerms = async () => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      termsAccepted: true,
      termsAcceptedAt: serverTimestamp(),
    });
  };

  const acknowledgeWarning = async () => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      warningAcknowledged: true,
      accountStatus: 'active',
    });
  };

  const clearBannedMessage = () => setBannedMessage(null);

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      isPremium,
      loading,
      bannedMessage,
      verificationBlocked,
      login,
      signup,
      logout,
      forgotPassword,
      resendVerification,
      verifyOTP,
      clearBannedMessage,
      changePassword,
      acceptTerms,
      acknowledgeWarning,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
