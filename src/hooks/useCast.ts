import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';
import { DEFAULTS } from '../constants/settings';

export function useCast() {
  const { pushCouchState } = useData();
  const [isCasting, setIsCasting] = useState(false);
  const isInitializedRef = useRef(false);

  const onSessionStateChanged = useCallback((event: { sessionState: cast.framework.SessionState }) => {
    const state = event.sessionState;
    const framework = window.cast?.framework;
    if (!framework) return;
    
    const { SESSION_STARTED, SESSION_RESUMED, SESSION_ENDED, SESSION_START_FAILED } = framework.SessionState;
    
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

  const onCastError = useCallback((event: { error_code: string; detailed_error_code?: string }) => {
    logger.error(`[Cast] Global Cast Error: ${event.error_code}${event.detailed_error_code ? ` (Detailed: ${event.detailed_error_code})` : ''}`);
  }, []);

  const initializeCast = useCallback((isAvailable: boolean) => {
    if (!isAvailable || isInitializedRef.current) return;

    try {
      const castFramework = window.cast?.framework;
      const chromeCast = window.chrome?.cast;
      const castContext = castFramework?.CastContext?.getInstance?.();
      
      if (!castContext || !chromeCast) return;

      castContext.setOptions({
        receiverApplicationId: DEFAULTS.CAST_APP_ID,
        autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      castContext.addEventListener(
        castFramework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChanged
      );

      castContext.addEventListener(
        castFramework.CastContextEventType.CAST_ERROR,
        onCastError
      );

      isInitializedRef.current = true;
      setIsCasting(Boolean(castContext.getCurrentSession()));
    } catch (err) {
      logger.error('Failed to initialize Cast Context:', err);
    }
  }, [onSessionStateChanged, onCastError]);

  useEffect(() => {
    (window as any).__onGCastApiAvailable = initializeCast;
    const isAvailable = Boolean((window as any).chrome?.cast?.isAvailable || (window as any).cast?.framework);
    if (isAvailable) initializeCast(true);

    return () => {
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      const castFramework = window.cast?.framework;
      if (castContext && castFramework && isInitializedRef.current) {
        castContext.removeEventListener(castFramework.CastContextEventType.SESSION_STATE_CHANGED, onSessionStateChanged);
        castContext.removeEventListener(castFramework.CastContextEventType.CAST_ERROR, onCastError);
      }
      isInitializedRef.current = false;
    };
  }, [initializeCast, onSessionStateChanged, onCastError]);

  const toggleCast = async () => {
    const castFramework = window.cast?.framework;
    const castContext = castFramework?.CastContext?.getInstance();

    if (!castContext) {
      toast.error(`Cast SDK not ready (AppID: ${DEFAULTS.CAST_APP_ID}). Please refresh.`);
      return;
    }

    try {
      if (castContext.getSessionState() === castFramework.SessionState.SESSION_STARTED) {
        await castContext.endCurrentSession(true);
      } else {
        await castContext.requestSession({ receiverApplicationId: DEFAULTS.CAST_APP_ID });
      }
    } catch (error) {
      const errorStr = String(error);
      const detailedCode = (error as any)?.detailed_error_code || (window.chrome?.cast as any)?.lastError?.code || 'unknown';
      logger.error('[Cast] Session Toggle Failed:', { error, detailedCode });
      
      if (!errorStr.includes('cancel')) {
        toast.error(`Cast Error: ${errorStr} (Detail: ${detailedCode})`);
      }
    }
  };

  return { isCasting, toggleCast, appId: DEFAULTS.CAST_APP_ID };
}
