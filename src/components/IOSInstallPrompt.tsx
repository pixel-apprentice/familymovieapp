import React, { useState, useEffect } from 'react';
import { Share, PlusCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAStatus } from '../hooks/usePWAStatus';
import { hapticFeedback } from '../utils/haptics';

export function IOSInstallPrompt() {
  const { isIOS, isInstalled } = usePWAStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the user is on iOS, it is not installed (standalone), and they haven't dismissed it
    const dismissed = localStorage.getItem('fmn_ios_prompt_dismissed') === 'true';
    if (isIOS && !isInstalled && !dismissed) {
      // Delay showing it slightly for a better UX (e.g. 2.5 seconds after page load)
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isIOS, isInstalled]);

  const handleDismiss = () => {
    hapticFeedback.light();
    localStorage.setItem('fmn_ios_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-theme-surface/95 border border-theme-border/60 shadow-2xl rounded-2xl p-4 backdrop-blur-xl font-['Outfit'] select-none"
        >
          <div className="flex gap-3 relative">
            <div className="flex-shrink-0 w-12 h-12 bg-theme-primary/10 rounded-xl flex items-center justify-center text-2xl border border-theme-primary/15 shadow-inner">
              🍕
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-theme-primary mb-1">
                Install App on iPhone
              </h3>
              <p className="text-xs text-theme-muted leading-relaxed">
                Add to your Home Screen for a premium, fullscreen app experience and offline access.
              </p>
              
              <div className="mt-3 flex flex-col gap-2 border-t border-theme-border/30 pt-3">
                <div className="flex items-center gap-2.5 text-xs text-theme-text/90">
                  <span className="flex items-center justify-center w-5 h-5 bg-theme-base/80 border border-theme-border/40 rounded text-[10px]">
                    <Share size={12} className="text-blue-500" />
                  </span>
                  <span>1. Tap the <strong>Share</strong> button at the bottom of Safari.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-theme-text/90">
                  <span className="flex items-center justify-center w-5 h-5 bg-theme-base/80 border border-theme-border/40 rounded text-[10px]">
                    <PlusCircle size={12} />
                  </span>
                  <span>2. Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="absolute right-0 top-0 p-1 text-theme-muted hover:text-theme-text transition-colors rounded-lg hover:bg-theme-border/10"
              aria-label="Close prompt"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Subtle pointer pointing down at iPhone bottom bar */}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-theme-surface border-r border-b border-theme-border/60 pointer-events-none md:hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
