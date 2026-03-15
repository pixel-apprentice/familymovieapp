import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tv } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLocation } from 'react-router-dom';
import { hapticFeedback } from '../utils/haptics';
import { logger } from '../utils/logger';

/// <reference types="chromecast-caf-sender" />

declare global {
  interface Window {
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}

export function CastButton() {
  const { pushCouchState } = useData();
  const location = useLocation();
  const [isCasting, setIsCasting] = useState(false);
  const isInitializedRef = useRef(false);

  const onSessionStateChanged = useCallback((event: any) => {
    const state = event.sessionState;
    const casting = state === cast.framework.SessionState.SESSION_STARTED || state === cast.framework.SessionState.SESSION_RESUMED;

    if (casting) {
      setIsCasting(true);
      pushCouchState({ path: window.location.pathname, timestamp: Date.now() });
    } else if (state === 'SESSION_ENDED') {
      setIsCasting(false);
    }
  }, [pushCouchState]);

  const initializeCast = useCallback((isAvailable: boolean) => {
    if (!isAvailable || isInitializedRef.current) return;

    try {
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      if (!castContext) return;

      // Always prefer the custom receiver, but fall back to default ONLY if env var is missing during dev.
      // In production, the intention is to ALWAYS use the VITE_CAST_APP_ID.
      const appId = import.meta.env.VITE_CAST_APP_ID || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      if (!import.meta.env.VITE_CAST_APP_ID) {
        logger.error('[Cast] CRITICAL: VITE_CAST_APP_ID is missing. Falling back to default receiver which will NOT load the custom web app UI.');
      }

      const sessionRequest = new window.chrome.cast.SessionRequest(appId);
      sessionRequest.capabilities = [window.chrome.cast.Capability.VIDEO_OUT];

      castContext.setOptions({
        receiverApplicationId: appId,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGINAL_SCOPE,
        sessionRequest,
      });

      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChanged as any
      );

      isInitializedRef.current = true;
      setIsCasting(Boolean(castContext.getCurrentSession()));
    } catch (err) {
      logger.error('Failed to initialize Cast Context:', err);
    }
  }, [onSessionStateChanged]);

  useEffect(() => {
    window.__onGCastApiAvailable = initializeCast;

    if (typeof window !== 'undefined' && window.chrome?.cast?.isAvailable) {
      initializeCast(true);
    }

    return () => {
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      if (castContext && isInitializedRef.current) {
        castContext.removeEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          onSessionStateChanged as any
        );
      }
      isInitializedRef.current = false;
      window.__onGCastApiAvailable = () => {};
    };
  }, [initializeCast, onSessionStateChanged]);

  const handleCastClick = async () => {
    hapticFeedback.medium();
    try {
      // Trigger the native Chrome Cast dialog
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      await castContext?.requestSession?.();
    } catch (error) {
      logger.error('Native cast session request failed:', error);
    }
  };

  return (
    <button
      onClick={handleCastClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation text-[10px] font-black uppercase tracking-widest ${isCasting
        ? 'bg-theme-primary text-theme-base shadow-lg animate-pulse'
        : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
        }`}
      title={isCasting ? 'Casting to TV...' : 'Connect to TV'}
    >
      <Tv size={16} />
      <span className="hidden sm:inline">Connect TV</span>
    </button>
  );
}
