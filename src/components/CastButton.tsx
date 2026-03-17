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

const CAST_APP_ID = 'EEFE3131';

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

      // Always use the hardcoded custom receiver ID for stabilization
      const appId = CAST_APP_ID;
      console.log('🏁 Cast App ID Enforced:', appId);
      logger.log(`[Cast] Selected App ID: ${appId}`);
      
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
    const castFramework = (window as any).cast?.framework;
    const castContext = castFramework?.CastContext?.getInstance();
    const appId = CAST_APP_ID;

    if (!castContext) {
      toast.error(`Cast SDK not ready (AppID: ${appId}). Please refresh.`);
      return;
    }

    try {
      if (castContext.getSessionState() === castFramework.SessionState.SESSION_STARTED) {
        logger.log('[Cast] Ending session...');
        await castContext.endCurrentSession(true);
      } else {
        console.log('🚀 Requesting Cast Session for ID:', appId);
        logger.log(`[Cast] Requesting session for AppID: ${appId}...`);
        
        // PASS APP ID EXPLICITLY IN THE REQUEST
        const result = await castContext.requestSession({
          receiverApplicationId: appId
        });
        if (result) {
          logger.log('[Cast] Session starting success:', result);
        }
      }
    } catch (error: any) {
      const errorStr = String(error);
      // CAF often follows this structure for detailed errors
      const detailedCode = error?.detailed_error_code || (window as any).chrome?.cast?.lastError?.code || 'unknown';
      const errorDesc = (window as any).chrome?.cast?.lastError?.description || '';
      
      logger.error('[Cast] Session Action Failed:', { error, detailedCode, appId, errorDesc });

      if (errorStr.includes('cancel')) {
        toast.info('Cast request cancelled.');
      } else if (errorStr.includes('session_error') || errorStr.includes('session_start_failed') || errorStr.includes('error')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm text-red-400">Cast Handshake Failed</span>
            <div className="flex flex-col gap-0.5 p-2 bg-black/20 rounded-lg border border-white/5 my-1">
              <span className="text-[10px] font-mono opacity-90 uppercase">Code: {detailedCode}</span>
              <span className="text-[10px] font-mono opacity-70">App ID: {appId}</span>
              {errorDesc && <span className="text-[9px] opacity-60 italic mt-0.5">"{errorDesc}"</span>}
            </div>
            <p className="text-[10px] opacity-80 leading-relaxed">
              Usually means <span className="text-white font-semibold underline decoration-white/20 underline-offset-2">familymovieapp.vercel.app</span> is missing from 'Authorized Domains' in your Cast Console.
            </p>
          </div>,
          { 
            duration: 10000,
            action: {
              label: 'Open Console',
              onClick: () => window.open('https://cast.google.com/publish/', '_blank')
            }
          }
        );
      } else {
        toast.error(`Cast Error: ${errorStr} (Detail: ${detailedCode})`);
      }
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
