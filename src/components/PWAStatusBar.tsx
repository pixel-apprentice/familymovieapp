import React from 'react';
import { Download, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { usePWAStatus } from '../hooks/usePWAStatus';
import { hapticFeedback } from '../utils/haptics';

export function PWAStatusBar() {
  const { isOnline, isInstallable, isInstalled, hasUpdate, promptInstall, applyUpdate } = usePWAStatus();

  const handleInstall = async () => {
    hapticFeedback.light();
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App installed! You can launch it from your home screen.');
    }
  };

  const handleUpdate = async () => {
    hapticFeedback.medium();
    const updated = await applyUpdate();
    if (!updated) {
      toast.error('No update action is available right now.');
    }
  };

  if (isOnline && !isInstallable && !hasUpdate) return null;

  return (
    <div className="bg-theme-surface/80 border-b border-theme-border/60 backdrop-blur-lg px-3 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-3">
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
      </div>
    </div>
  );
}
