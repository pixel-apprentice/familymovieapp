import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker — auto-updates in background
// Shows no prompt, just silently updates on next load
registerSW({
  onNeedRefresh() {
    // Could show a toast here, but silent auto-update is fine for a family app
    console.log('[PWA] New content available — will refresh on next load.');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline!');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
