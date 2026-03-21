import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CouchState } from '../types/movie';
import { logger } from '../utils/logger';

/**
 * Handles synchronizing the TV's router with the phone's CouchState.
 */
export function useCouchNavigationSync(isCouchMode: boolean, couchState: CouchState | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const lastSyncTimestampRef = useRef(0);

  useEffect(() => {
    if (isCouchMode && couchState && couchState.timestamp > lastSyncTimestampRef.current) {
      const isOnTvLanding = location.pathname === '/tv';
      const tvPathBase = '/tv';
      
      // Normalize the incoming path to a TV path
      const targetPath = couchState.path === '/' ? tvPathBase : `${tvPathBase}${couchState.path}`;
      const isNewPath = location.pathname !== targetPath;
      
      lastSyncTimestampRef.current = couchState.timestamp;
      
      const isPhoneOnMovie = couchState.path.startsWith('/movie/');
      
      // Synchronize routing securely, using replace to avoid bloated TV browser histories.
      if (isNewPath) {
        if (isOnTvLanding) {
          if (isPhoneOnMovie) {
            logger.log("[Couch Mode] Phone on movie. Syncing to:", targetPath);
            navigate(targetPath, { replace: true });
          }
        } else {
            logger.log("[Couch Mode] Syncing navigation to:", targetPath);
            navigate(targetPath, { replace: true });
        }
      }
    }
  }, [isCouchMode, couchState, location.pathname, navigate]);
}
