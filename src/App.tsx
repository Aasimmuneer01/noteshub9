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
      <MaintenanceCountdown settings={settings} />
      <UnreadNotification />
      <Navbar />
      <main className="flex-1 overflow-auto pt-16">
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

export default function App() {
  const [shutdownSettings, setShutdownSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);

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

  if (loading) {
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

  
  const now = new Date();
  const startTime = shutdownSettings?.startTime?.toDate();
  const restoreTime = shutdownSettings?.restoreTime?.toDate();
  const isMaintenanceMode = (shutdownSettings?.mode === 'Maintenance' || shutdownSettings?.mode === 'Shutdown') && 
                            startTime && now >= startTime && 
                            (!restoreTime || now < restoreTime);
  const isShutdown = isMaintenanceMode;
  

  if (isShutdown) {
    return (
      <ShutdownPage 
        status={shutdownSettings.mode || 'Temporary'} 
        title={shutdownSettings.title} 
        description={shutdownSettings.description}
        returnDate={shutdownSettings.returnDate}
        contactEmail={shutdownSettings.contactEmail}
      />
    );
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="*" element={<MainLayout settings={shutdownSettings} />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
