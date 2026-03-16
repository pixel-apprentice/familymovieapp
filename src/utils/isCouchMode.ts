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
  // This is present when running inside a Chromecast Receiver
  try {
    if (typeof window !== 'undefined') {
      const isTVAgent = window.navigator.userAgent.indexOf('CrKey') > -1;
      const hasReceiverContext = (window as any).cast?.framework?.CastReceiverContext;
      
      // If we are on a TV, we are in couch mode. 
      // If we have the context BUT we are not on a TV, it's likely a phone loading the SDK for debugging.
      if (isTVAgent && hasReceiverContext) return true;
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
