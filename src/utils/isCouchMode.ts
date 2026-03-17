export function isCouchModeEnabled(search?: string): boolean {
  // 1. Explicit exit hatch (cleanup happens in useEffect in App)
  if (search?.includes('exit_couch=true')) return false;

  // 2. Explicit couch query param (strongest signal)
  if (search?.includes('couch=true')) return true;

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
      
      // If we are on a TV, we are in couch mode.
      if (isTVAgent || (window as any).isCastReceiver) return true;

      // Fallback for context detection if UA is masked or missing
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
