import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { Modal } from './components/Modal';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/StatsPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { useDatabaseSeed } from './hooks/useDatabaseSeed';

function AppContent() {
  useDatabaseSeed();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
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
          <DataProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </DataProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

