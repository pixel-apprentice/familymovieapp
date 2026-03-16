export function isCouchModeEnabled(search?: string): boolean {
  // 1. Explicit query param (strongest signal)
  if (search?.includes('couch=true')) return true;

  // 2. Persistent storage (sticks across navigations/reloads)
  try {
    if (localStorage.getItem('fmn_couch_mode') === 'true') return true;
  } catch { /* ignore */ }

  // 3. Auto-detect Google Cast Receiver SDK (CAF)
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
