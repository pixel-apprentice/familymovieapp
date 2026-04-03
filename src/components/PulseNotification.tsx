import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle, PlusCircle, User, Info, RefreshCcw } from 'lucide-react';
import { PulseEvent } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { useLocation } from 'react-router-dom';
import { isCouchModeEnabled } from '../utils/isCouchMode';

export function PulseNotification({ event }: { event: PulseEvent | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeEvent, setActiveEvent] = useState<PulseEvent | null>(null);
  const location = useLocation();
  const isCouchMode = isCouchModeEnabled(location.search);

  // --- Routing logic: show on the right device only ---
  // Events without a target default to 'tv' (legacy Firestore docs)
  const target = event?.target ?? 'tv';
  const shouldShowOnThisDevice =
    target === 'all' ||
    (target === 'tv' && isCouchMode) ||
    (target === 'mobile' && !isCouchMode);

  // TV mode has its own integrated panel in CouchAlert — skip the floating overlay there
  // UNLESS we're explicitly targeting 'all' (e.g. system status updates)
  if (isCouchMode && target !== 'all') return null;

  useEffect(() => {
    if (!shouldShowOnThisDevice) return;
    if (event && (!activeEvent || event.timestamp !== activeEvent.timestamp)) {
      setActiveEvent(event);
      setIsVisible(true);
      
      // Status events stay longer if they have actions
      const duration = event.type === 'status' && event.onAction ? 10000 : 5000;
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);

    }
  }, [event, activeEvent]);

  if (!activeEvent) return null;

  const handleAction = () => {
    if (activeEvent.onAction) {
      hapticFeedback.medium();
      activeEvent.onAction();
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-full max-w-lg px-6 transition-all duration-500 ${isCouchMode ? 'scale-150 bottom-24' : ''}`}
          onClick={activeEvent.onAction ? handleAction : undefined}
          role={activeEvent.onAction ? 'button' : undefined}
        >
          <div className={`bg-theme-surface/90 backdrop-blur-2xl border-2 border-theme-primary/30 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 overflow-hidden transition-all ${activeEvent.onAction ? 'hover:scale-[1.02] active:scale-95 cursor-pointer ring-4 ring-theme-primary/20' : ''}`}>
            {/* Action Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              activeEvent.type === 'rating' ? 'bg-amber-500 text-white' :
              activeEvent.type === 'watched' ? 'bg-emerald-500 text-white' :
              activeEvent.type === 'status' ? 'bg-theme-primary text-theme-base' :
              'bg-blue-500 text-white'
            }`}>
              {activeEvent.type === 'rating' && <Star size={28} fill="currentColor" />}
              {activeEvent.type === 'watched' && <CheckCircle size={28} />}
              {activeEvent.type === 'added' && <PlusCircle size={28} />}
              {activeEvent.type === 'status' && <RefreshCcw size={28} className="animate-spin-slow" />}
            </div>

            <div className="flex-1 min-w-0">
              {activeEvent.userName && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                    <User size={12} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-primary">
                    {activeEvent.userName}
                  </span>
                </div>
              )}
              
              <h4 className="text-xl font-black tracking-tight text-theme-text truncate leading-tight">
                {activeEvent.type === 'rating' && `Rated ${activeEvent.movieTitle}`}
                {activeEvent.type === 'watched' && `Watched ${activeEvent.movieTitle}!`}
                {activeEvent.type === 'added' && `Added ${activeEvent.movieTitle}`}
                {activeEvent.type === 'status' && (activeEvent.title || 'Notification')}
              </h4>
              
              <p className="text-theme-muted text-sm font-medium mt-0.5">
                {activeEvent.type === 'rating' && (
                  <span className="inline-flex items-center gap-1.5">
                    gave it 
                    <span className="text-amber-500 font-black flex items-center gap-1">
                      {activeEvent.value}
                      <Star 
                        size={14} 
                        fill={Number(activeEvent.value) % 1 !== 0 ? 'url(#halfStarDetail)' : 'currentColor'} 
                        className="text-amber-400"
                      />
                    </span>
                  </span>
                )}
                {activeEvent.type === 'watched' && "Marked as completed!"}
                {activeEvent.type === 'added' && "New flick on the wishlist!"}
                {activeEvent.type === 'status' && (activeEvent.message || "Something happened.")}
              </p>
            </div>

            {activeEvent.onAction && (
              <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary animate-pulse">
                <Info size={20} />
              </div>
            )}

            {/* Backdrop Glow */}
            <div className={`absolute inset-0 opacity-10 pointer-events-none ${
              activeEvent.type === 'rating' ? 'bg-amber-500' :
              activeEvent.type === 'watched' ? 'bg-emerald-500' :
              activeEvent.type === 'status' ? 'bg-theme-primary' :
              'bg-blue-500'
            }`} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
