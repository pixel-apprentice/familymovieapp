import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type UpdateSWFn = (reloadPage?: boolean) => Promise<void>;

export function usePWAStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined'
      ? (window.matchMedia?.('(display-mode: standalone)')?.matches ?? false) || (window.navigator as any).standalone
      : false
  );
  const [isIOS, setIsIOS] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAction, setUpdateAction] = useState<UpdateSWFn | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    const onUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<UpdateSWFn | undefined>;
      if (typeof customEvent.detail === 'function') {
        setUpdateAction(() => customEvent.detail);
      }
      setHasUpdate(true);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('fmn:pwa-update-available', onUpdateAvailable);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('fmn:pwa-update-available', onUpdateAvailable);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                          (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    const accepted = result.outcome === 'accepted';
    if (accepted) {
      setIsInstallable(false);
      setInstallPrompt(null);
    }
    return accepted;
  }, [installPrompt]);

  const applyUpdate = useCallback(async () => {
    if (!updateAction) return false;
    await updateAction(true);
    return true;
  }, [updateAction]);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    hasUpdate,
    promptInstall,
    applyUpdate,
    isIOS
  };
}
