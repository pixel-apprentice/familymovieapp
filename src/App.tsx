import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Modal } from './components/Modal';
import { Layout } from './components/Layout';
import { logger } from './utils/logger';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/StatsPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { CouchPage } from './pages/CouchPage';
import { useDatabaseSeed } from './hooks/useDatabaseSeed';
import { isCouchModeEnabled, enableCouchMode, clearCouchMode } from './utils/isCouchMode';

function AppContent() {
  useDatabaseSeed();
  const { loading: authLoading } = useAuth();
  const { couchState, pushPulseEvent } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const lastSyncTimestampRef = React.useRef(0);

  const isCouchMode = isCouchModeEnabled(location.search);

  // Handle Couch Mode persistence side effects
  React.useEffect(() => {
    if (location.search.includes('exit_couch=true')) {
      clearCouchMode();
    } else if (location.search.includes('couch=true')) {
      enableCouchMode();
    }
  }, [location.search]);

  // Global Sync Listener for TV
  React.useEffect(() => {
    if (isCouchMode && couchState && couchState.timestamp > lastSyncTimestampRef.current) {
      const isNewPath = location.pathname !== couchState.path;
      
      // Always update the ref so we "consume" the update
      lastSyncTimestampRef.current = couchState.timestamp;
      
      if (isNewPath) {
        logger.log("[Couch Mode] Syncing navigation to:", couchState.path);
        navigate(couchState.path);
      } else {
        logger.log("[Couch Mode] Already at path:", couchState.path);
      }
    }
  }, [isCouchMode, couchState, location.pathname, navigate]);

  // Force Redirect for TV landing on root - REMOVED to prevent loop
  // CouchPage.tsx now handles the entry point and synchronization logic.

  // PWA Update Cinematic Notification
  React.useEffect(() => {
    const handleUpdate = () => {
      pushPulseEvent({
        type: 'status',
        title: 'System Update',
        message: 'A new version of Family Movie Night is ready. Click to update!',
        onAction: () => {
          logger.log('[PWA] User triggered update reload.');
          window.location.reload();
        }
      });
    };
    window.addEventListener('fmn:pwa-update-available', handleUpdate);
    return () => window.removeEventListener('fmn:pwa-update-available', handleUpdate);
  }, [pushPulseEvent]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-base">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-theme-primary flex items-center justify-center text-theme-base font-black text-2xl shadow-xl animate-pulse">
            F
          </div>
          <div className="w-8 h-8 border-4 border-theme-border border-t-theme-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/couch" element={<CouchPage />} />
      </Routes>
      <Modal />
      <Toaster position="top-center" richColors />
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ModalProvider>
            <SettingsProvider>
              <DataProvider>
                <AppContent />
              </DataProvider>
            </SettingsProvider>
          </ModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
