export function isCouchModeEnabled(search?: string): boolean {
  // 1. Explicit exit hatch (cleanup)
  if (search?.includes('exit_couch=true')) {
    clearCouchMode();
    return false;
  }

  // 2. Explicit couch query param (strongest signal)
  if (search?.includes('couch=true')) {
    enableCouchMode(); // Ensure it's persisted if we have the param
    return true;
  }

  // 3. Persistent storage
  try {
    if (localStorage.getItem('fmn_couch_mode') === 'true') return true;
  } catch { /* ignore */ }

  // 4. Auto-detect Google Cast Receiver SDK (CAF)
  // This is present when running inside a Chromecast Receiver
  if (typeof window !== 'undefined' && (window as any).cast?.framework?.CastReceiverContext) {
    return true;
  }

  return false;
}

export function enableCouchMode(): void {
  try {
    localStorage.setItem('fmn_couch_mode', 'true');
  } catch { /* ignore */ }
}

export function clearCouchMode(): void {
  try {
    localStorage.removeItem('fmn_couch_mode');
    localStorage.removeItem('fmn_couch_debug');
  } catch { /* ignore */ }
}
