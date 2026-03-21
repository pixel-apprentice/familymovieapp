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
    } else if (location.pathname.startsWith('/tv')) {
      enableCouchMode();
    }
  }, [location.search, location.pathname]);

  // THE CAST RECEIVER BOOT HAS MOVED TO index.html for zero-latency startup.
  // This allows the TV to check-in with the phone before React even mounts.

  // Global Sync Listener for TV
  React.useEffect(() => {
    if (isCouchMode && couchState && couchState.timestamp > lastSyncTimestampRef.current) {
      const isOnTvLanding = location.pathname === '/tv';
      const tvPathBase = '/tv';
      
      // Normalize the incoming path to a TV path
      const targetPath = couchState.path === '/' ? tvPathBase : `${tvPathBase}${couchState.path}`;
      const isNewPath = location.pathname !== targetPath;
      
      lastSyncTimestampRef.current = couchState.timestamp;
      
      const isPhoneOnMovie = couchState.path.startsWith('/movie/');
      
      if (isNewPath) {
        if (isOnTvLanding) {
          if (isPhoneOnMovie) {
            logger.log("[Couch Mode] Phone on movie. Syncing to:", targetPath);
            navigate(targetPath);
          }
        } else {
            logger.log("[Couch Mode] Syncing navigation to:", targetPath);
            navigate(targetPath);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-theme-base font-['Outfit'] select-none">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-theme-primary/10 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(var(--color-primary),0.2)] animate-pulse border border-theme-primary/20">
              🍕
            </div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-theme-primary border-t-transparent rounded-full animate-spin opacity-40" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-theme-primary">
              Pizza Movie Night
            </h1>
            <div className="h-1 w-12 bg-theme-primary/20 rounded-full overflow-hidden">
               <div className="h-full bg-theme-primary animate-[shimmer_2s_infinite] w-full" />
            </div>
          </div>
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
        
        {/* TV Routes */}
        <Route path="/tv" element={<CouchPage />} />
        <Route path="/tv/movie/:id" element={<MovieDetailPage />} />
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
