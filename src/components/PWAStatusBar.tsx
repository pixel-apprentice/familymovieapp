import React, { useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePWAStatus } from '../hooks/usePWAStatus';
import { hapticFeedback } from '../utils/haptics';

export function PWAStatusBar() {
  const { isOnline, isInstallable, isInstalled, hasUpdate, promptInstall, applyUpdate } = usePWAStatus();
  const [dismissed, setDismissed] = useState(false);

  const handleInstall = async () => {
    hapticFeedback.light();
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App installed! You can launch it from your home screen.');
      setDismissed(true);
    }
  };

  const handleUpdate = async () => {
    hapticFeedback.medium();
    const updated = await applyUpdate();
    if (!updated) {
      toast.error('No update action is available right now.');
    }
  };

  if ((isOnline && !isInstallable && !hasUpdate) || dismissed) return null;

  return (
    <div className="bg-theme-surface/80 border-b border-theme-border/60 backdrop-blur-lg px-3 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-3 relative pr-8">
        {!isOnline && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <WifiOff size={12} />
            Offline mode active
          </span>
        )}

        {isInstallable && !isInstalled && (
          <button
            onClick={handleInstall}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-primary text-theme-base text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Download size={12} />
            Install App
          </button>
        )}

        {hasUpdate && (
          <button
            onClick={handleUpdate}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
          >
            <RefreshCw size={12} />
            Update Ready
          </button>
        )}
        
        {isInstallable && !isInstalled && (
          <button 
            onClick={() => { hapticFeedback.light(); setDismissed(true); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-theme-muted hover:text-theme-text transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
