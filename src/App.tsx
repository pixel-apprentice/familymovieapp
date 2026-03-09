import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Modal } from './components/Modal';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/StatsPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { CouchPage } from './pages/CouchPage';
import { useDatabaseSeed } from './hooks/useDatabaseSeed';
import { useData } from './contexts/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';

function AppContent() {
  useDatabaseSeed();
  const { loading: authLoading } = useAuth();
  const { couchState } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const isCouchMode = sessionStorage.getItem('fmn_couch_mode') === 'true' || location.search.includes('couch=true');

  // Global Sync Listener for TV
  React.useEffect(() => {
    if (isCouchMode && couchState && couchState.path !== location.pathname) {
      console.log("[Couch Mode] Syncing navigation to:", couchState.path);
      navigate(couchState.path);
    }
  }, [isCouchMode, couchState, location.pathname, navigate]);

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
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <SettingsProvider>
            <DataProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </DataProvider>
          </SettingsProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

