/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import UnreadNotification from './components/UnreadNotification';
import Home from './pages/Home';
import Resources from './pages/Resources';
import PDFViewer from './components/PDFViewer';
import Bookmarks from './pages/Bookmarks';
import Folders from './pages/Folders';
import OfflineLibrary from './pages/OfflineLibrary';
import AIAssistant from './pages/AIAssistant';
import AIChatHistory from './pages/AIChatHistory';
import Chat from './pages/Chat';
import AdminPage from './pages/Admin';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import VerificationScreen from './components/VerificationScreen';
import TermsOfUse from './pages/legal/TermsOfUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';
import Copyright from './pages/legal/Copyright';
import CommunityGuidelines from './pages/legal/CommunityGuidelines';
import Contact from './pages/legal/Contact';
import BanPolicy from './pages/legal/BanPolicy';
import PremiumAgreement from './pages/legal/PremiumAgreement';
import Footer from './components/Footer';
import TermsAcceptanceDialog from './components/TermsAcceptanceDialog';
import PremiumNotificationPopup from './components/PremiumNotificationPopup';
import WarningModal from './components/WarningModal';
import { NewFeaturePopup } from './components/common/NewFeaturePopup';
import ShutdownPage from './components/ShutdownPage';
import { MaintenanceCountdown } from './components/MaintenanceCountdown';

function MainLayout({ settings }: { settings: any }) {
  const { user, loading, verificationBlocked, userData, acceptTerms, acknowledgePremiumNotification, acknowledgeWarning, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  
  // Terms check
  const termsAccepted = !!userData?.termsAccepted;
  
  const isAdmin = ['admin', 'superadmin'].includes(userData?.role || '') || user?.email === 'aasimmuneer349@gmail.com' || user?.email === 'noteshub9.official@gmail.com';
  
  useEffect(() => {
    if (user && userData && userData.lastPopupVersion !== '1.0') {
      setShowPopup(true);
    }
  }, [user, userData]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const publicRoutes = ['/terms', '/privacy', '/refund', '/copyright', '/guidelines', '/contact', '/ban-policy', '/premium-agreement'];
  
  if (!user && !publicRoutes.includes(location.pathname)) {
    return <AuthScreen />;
  }

  if (user && verificationBlocked) {
    return <VerificationScreen />;
  }

  if (user && !termsAccepted && location.pathname !== '/terms') {
    return <TermsAcceptanceDialog onAccept={acceptTerms} onDecline={logout} />;
  }

  if (user && termsAccepted && userData?.isPremium && userData?.premiumType === 'global_free' && !userData?.premiumNotificationShown && location.pathname !== '/terms') {
    return <PremiumNotificationPopup onAcknowledge={async () => {
      await acknowledgePremiumNotification();
      navigate('/');
    }} />;
  }

  if (userData?.accountStatus === 'warning' && userData.warningAcknowledged !== true && userData.warnings && userData.warnings.length > 0 && location.pathname !== '/terms') {
    return <WarningModal warnings={userData.warnings} onUnderstand={acknowledgeWarning} />;
  }

  return (
    <div className="min-h-screen bg-background-main text-text-main flex flex-col">
      {showPopup && <NewFeaturePopup version="1.0" onClose={() => {
        setShowPopup(false);
        if (user) {
          updateDoc(doc(db, 'users', user.uid), {
            lastPopupVersion: '1.0'
          });
        }
      }} />}
      <UnreadNotification />
      <Navbar settings={settings} />
      <main className="flex-1 overflow-auto pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/offline" element={<OfflineLibrary />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/ai-history" element={<AIChatHistory />} />
          <Route path="/chat" element={<Chat />} />
          {isAdmin && <Route path="/admin" element={<AdminPage />} />}
          <Route path="/profile" element={<Profile />} />
          <Route path="/viewer/:resourceId" element={<PDFViewer />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/copyright" element={<Copyright />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ban-policy" element={<BanPolicy />} />
          <Route path="/premium-agreement" element={<PremiumAgreement />} />
        </Routes>
      </main>
      {!location.pathname.startsWith('/viewer/') && <BottomNav />}
      <Footer />
    </div>
  );
}

const EXEMPT_ADMINS = [
  'aasimmunir349@gmail.com',
  'aasimmuneer349@gmail.com',
  'noteshub9.official@gmail.com'
];

function AppContent() {
  const [shutdownSettings, setShutdownSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);
  const [tick, setTick] = useState(0);
  const { user, loading: authLoading, userData } = useAuth();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.removeItem('maintenance_mode');
      localStorage.removeItem('shutdown_mode');
      localStorage.removeItem('maintenance');
      localStorage.removeItem('shutdown');
      sessionStorage.removeItem('maintenance_mode');
      sessionStorage.removeItem('shutdown_mode');
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'website_control', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        setShutdownSettings(docSnap.data());
      } else {
        setShutdownSettings({ mode: 'Online' });
      }
      setIsFirestoreOnline(true);
      setLoading(false);
    }, (error) => {
      console.error("Website control listener error:", error);
      setIsFirestoreOnline(false);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isFirestoreOnline) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-text-main">Connecting to NotesHub9...</h2>
        </div>
      </div>
    );
  }

  const nowMs = new Date().getTime();
  
  let startMs: number | undefined = undefined;
  if (shutdownSettings?.startTime) {
    if (typeof shutdownSettings.startTime.toDate === 'function') {
      startMs = shutdownSettings.startTime.toDate().getTime();
    } else if (shutdownSettings.startTime instanceof Date) {
      startMs = shutdownSettings.startTime.getTime();
    } else if (typeof shutdownSettings.startTime === 'string' || typeof shutdownSettings.startTime === 'number') {
      startMs = new Date(shutdownSettings.startTime).getTime();
    }
  }

  let restoreMs: number | undefined = undefined;
  if (shutdownSettings?.restoreTime) {
    if (typeof shutdownSettings.restoreTime.toDate === 'function') {
      restoreMs = shutdownSettings.restoreTime.toDate().getTime();
    } else if (shutdownSettings.restoreTime instanceof Date) {
      restoreMs = shutdownSettings.restoreTime.getTime();
    } else if (typeof shutdownSettings.restoreTime === 'string' || typeof shutdownSettings.restoreTime === 'number') {
      restoreMs = new Date(shutdownSettings.restoreTime).getTime();
    }
  }
  
  const userEmailLower = user?.email?.toLowerCase() || '';
  const isExemptAdmin = EXEMPT_ADMINS.some(email => email.toLowerCase() === userEmailLower) || ['admin', 'superadmin'].includes(userData?.role || '');
  const isOwnerBypass = isExemptAdmin;

  const scheduleEnabled = !!shutdownSettings?.enabled;
  const scheduleMode = shutdownSettings?.mode || 'Maintenance';

  const isInvalidSchedule = startMs && restoreMs && restoreMs <= startMs;
  const hasValidTimestamps = startMs && restoreMs && !isInvalidSchedule;

  if (isInvalidSchedule) {
    console.log("[Scheduler] INVALID SCHEDULE");
    console.log("[Scheduler] restoreAt must be later than startAt");
    console.log("[Scheduler] Ignoring scheduled state");
  }

  const scheduleUpcoming = scheduleEnabled && hasValidTimestamps && nowMs < startMs;
  const scheduleActive = scheduleEnabled && hasValidTimestamps && nowMs >= startMs && nowMs < restoreMs;
  const scheduleExpired = scheduleEnabled && hasValidTimestamps && nowMs >= restoreMs;

  let scheduledMaintenance = false;
  let scheduledShutdown = false;

  if (scheduleActive) {
    if (scheduleMode === 'Shutdown') {
      scheduledShutdown = true;
    } else {
      scheduledMaintenance = true;
    }
  }

  let scheduleStatus = 'DISABLED';
  if (!scheduleEnabled) {
    scheduleStatus = 'DISABLED';
  } else if (isInvalidSchedule) {
    scheduleStatus = 'INVALID';
  } else if (scheduleUpcoming) {
    scheduleStatus = 'UPCOMING';
  } else if (scheduleActive) {
    scheduleStatus = 'ACTIVE';
  } else if (scheduleExpired) {
    scheduleStatus = 'EXPIRED';
  }

  // Maintenance and Shutdown are strictly determined by the scheduler ONLY.
  let maintenanceActive = scheduledMaintenance;
  let shutdownActive = scheduledShutdown;

  let maintenanceReason = 'none';
  if (scheduledMaintenance) {
    maintenanceReason = 'scheduledMaintenance';
  } else if (scheduledShutdown) {
    maintenanceReason = 'scheduledShutdown';
  }

  const isMaintenanceMode = maintenanceActive || shutdownActive;
  const activeStatusMode = shutdownActive ? 'Shutdown' : (maintenanceActive ? 'Maintenance' : 'Online');
  const isExempt = isOwnerBypass;
  const isShutdown = isMaintenanceMode && !isExempt;

  console.log("scheduleEnabled:", scheduleEnabled);
  console.log("scheduleMode:", scheduleMode);
  console.log("startAt:", startMs);
  console.log("restoreAt:", restoreMs);
  console.log("currentTime:", nowMs);
  console.log("scheduleStatus:", scheduleStatus);
  console.log("effectiveMaintenance:", maintenanceActive);
  console.log("effectiveShutdown:", shutdownActive);
  console.log("authenticatedUser:", user?.email || 'guest');
  console.log("isOwnerBypass:", isOwnerBypass);
  console.log("maintenanceReason:", maintenanceReason);

  if (isShutdown) {
    return (
      <ShutdownPage 
        status={activeStatusMode} 
        title={shutdownSettings?.title} 
        description={shutdownSettings?.description}
        returnDate={shutdownSettings?.returnDate}
        contactEmail={shutdownSettings?.contactEmail}
        restoreTime={shutdownSettings?.restoreTime}
      />
    );
  }

  return <MainLayout settings={shutdownSettings} />;
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="*" element={<AppContent />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
