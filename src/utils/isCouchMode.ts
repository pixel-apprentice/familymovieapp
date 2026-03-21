export function isCouchModeEnabled(search?: string): boolean {
  // 1. Path-based check (Primary)
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/tv')) return true;
  }

  // 2. Explicit exit hatch (cleanup happens in useEffect in App)
  if (search?.includes('exit_couch=true')) return false;

  // 3. Persistent storage
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('fmn_couch_mode') === 'true') {
      return true;
    }
  } catch { /* ignore */ }

  // 4. Auto-detect Google Cast Receiver SDK (CAF)
  try {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isTVAgent = ua.indexOf('CrKey') > -1 || (ua.indexOf('Android') > -1 && ua.indexOf('TV') > -1);
      
      // If we are on a hardware TV or the Cast Receiver SDK is active, authorize it.
      if (isTVAgent || (window as any).isCastReceiver || !!(window as any).__onGCastReceiverApiAvailable) {
        return true;
      }

      // Fallback for framework detection
      const hasReceiverContext = (window as any).cast?.framework?.CastReceiverContext;
      if (hasReceiverContext) return true;
    }
  } catch { /* ignore */ }

  return false;
}

export function enableCouchMode(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fmn_couch_mode', 'true');
    }
  } catch { /* ignore */ }
}

export function clearCouchMode(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fmn_couch_mode');
      localStorage.removeItem('fmn_couch_debug');
    }
  } catch { /* ignore */ }
}
