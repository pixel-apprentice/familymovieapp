import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tv } from 'lucide-react';
import { toast } from 'sonner';
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
    const framework = (window as any).cast?.framework;
    if (!framework) return;
    
    const { SESSION_STARTED, SESSION_RESUMED, SESSION_ENDED, SESSION_START_FAILED } = framework.SessionState;
    
    // Log state name for debugging
    const stateName = Object.keys(framework.SessionState).find(key => framework.SessionState[key] === state) || state;
    logger.log(`[Cast] Session State Changed: ${stateName} (${state})`);

    if (state === SESSION_STARTED || state === SESSION_RESUMED) {
      setIsCasting(true);
      pushCouchState({ path: window.location.pathname, timestamp: Date.now() });
    } else if (state === SESSION_ENDED || state === SESSION_START_FAILED) {
      setIsCasting(false);
      if (state === SESSION_START_FAILED) {
        logger.error('[Cast] Native cast session request failed: SESSION_START_FAILED');
      }
    }
  }, [pushCouchState]);

  const onCastError = useCallback((event: any) => {
    logger.error(`[Cast] Global Cast Error: ${event.error_code}${event.detailed_error_code ? ` (Detailed: ${event.detailed_error_code})` : ''}`);
  }, []);

  const initializeCast = useCallback((isAvailable: boolean) => {
    if (!isAvailable || isInitializedRef.current) return;

    try {
      const castFramework = (window as any).cast?.framework;
      const chromeCast = (window as any).chrome?.cast;
      
      const castContext = castFramework?.CastContext?.getInstance?.();
      if (!castContext || !chromeCast) return;

      // Always prefer the custom receiver, but fall back to default ONLY if env var is missing during dev.
      const appId = import.meta.env.VITE_CAST_APP_ID || chromeCast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      logger.log(`[Cast] Selected App ID: ${appId} (Using ${import.meta.env.VITE_CAST_APP_ID ? 'Configured' : 'Default'})`);
      
      if (!import.meta.env.VITE_CAST_APP_ID) {
        logger.error('[Cast] CRITICAL: VITE_CAST_APP_ID is missing. Falling back to default receiver.');
      }

      logger.log(`[Cast] Setting Options - AppId: ${appId}, Policy: ORIGIN_SCOPED`);
      
      castContext.setOptions({
        receiverApplicationId: appId,
        autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      castContext.addEventListener(
        castFramework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChanged as any
      );

      castContext.addEventListener(
        castFramework.CastContextEventType.CAST_ERROR,
        onCastError as any
      );

      isInitializedRef.current = true;
      setIsCasting(Boolean(castContext.getCurrentSession()));
    } catch (err) {
      logger.error('Failed to initialize Cast Context:', err);
    }
  }, [onSessionStateChanged]);

  useEffect(() => {
    window.__onGCastApiAvailable = initializeCast;

    const isAvailable = Boolean((window as any).chrome?.cast?.isAvailable || (window as any).cast?.framework);
    if (isAvailable) {
      initializeCast(true);
    }

    return () => {
      const castContext = (window as any).cast?.framework?.CastContext?.getInstance?.();
      const castFramework = (window as any).cast?.framework;
      if (castContext && castFramework && isInitializedRef.current) {
        castContext.removeEventListener(
          castFramework.CastContextEventType.SESSION_STATE_CHANGED,
          onSessionStateChanged as any
        );
        castContext.removeEventListener(
          castFramework.CastContextEventType.CAST_ERROR,
          onCastError as any
        );
      }
      isInitializedRef.current = false;
      window.__onGCastApiAvailable = () => {};
    };
  }, [initializeCast, onSessionStateChanged]);

  const handleCastClick = async () => {
    hapticFeedback.medium();
    try {
      const castContext = (window as any).cast?.framework?.CastContext?.getInstance?.();
      const session = castContext?.getCurrentSession();

      if (session) {
        logger.log('[Cast] Ending current session...');
        castContext.endCurrentSession(true);
        setIsCasting(false);
      } else {
        logger.log('[Cast] Requesting new session...');
        try {
          await castContext?.requestSession?.();
        } catch (err: any) {
          // CAF throws the error code as a string, but some versions provide an object
          const errorCode = typeof err === 'string' ? err : err?.code || 'unknown';
          const detailedCode = err?.detailed_error_code || 'none';
          
          logger.error(`[Cast] Session Request Failed: ${errorCode} (Detailed: ${detailedCode})`);
          
          let userMessage = "Cast couldn't connect.";
          if (errorCode === 'session_error') {
            userMessage = "Cast Session Error. Usually means your Vercel URL isn't authorized in Cast Console!";
          } else if (errorCode === 'cancel') {
            userMessage = "Cast cancelled.";
          }
          
          toast.error(userMessage, {
            duration: 6000,
            action: {
              label: "Check Console",
              onClick: () => window.open('https://cast.google.com/publish', '_blank')
            }
          });
        }
      }
    } catch (error) {
      logger.error('Native cast session action failed:', error);
    }
  };

  return (
    <button
      onClick={handleCastClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation text-[10px] font-black uppercase tracking-widest ${isCasting
        ? 'bg-theme-primary text-theme-base shadow-lg animate-pulse'
        : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
        }`}
      title={isCasting ? 'Click to stop casting' : 'Connect to TV'}
    >
      <Tv size={16} />
      <span className="hidden sm:inline">{isCasting ? 'Disconnect TV' : 'Connect TV'}</span>
    </button>
  );
}
