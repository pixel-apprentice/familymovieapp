import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const isTV = typeof window !== 'undefined' && window.navigator.userAgent.indexOf('CrKey') > -1;

let updateSW: any;
if (!isTV) {
  updateSW = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('fmn:pwa-update-available', { detail: updateSW }));
      console.log('[PWA] New content available.');
    },
    onOfflineReady() {
      console.log('[PWA] App is ready to work offline!');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
