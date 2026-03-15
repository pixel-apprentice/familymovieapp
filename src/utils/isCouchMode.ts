export function isCouchModeEnabled(search: string): boolean {
  return sessionStorage.getItem('fmn_couch_mode') === 'true' || search.includes('couch=true');
}
