import { FamilyProfile } from '../types/movie';

export const APP_NAME = 'Family Movie Night';

export const DEFAULT_PROFILES: FamilyProfile[] = [
  { id: 'Jack', name: 'Jack', color: '#60a5fa' },
  { id: 'Simone', name: 'Simone', color: '#f472b6' },
  { id: 'Mom', name: 'Mom', color: '#34d399' },
  { id: 'Dad', name: 'Dad', color: '#fbbf24' }
];

export const CACHE_KEYS = {
  PROFILES: 'fmn_profiles_cache',
  TURN_INDEX: 'fmn_turn_cache',
  LOCAL_MOVIES: 'localMovies',
  LOCAL_TURN: 'localTurn',
  THEME: 'activeTheme',
  LAST_ERROR: 'fmn_last_error',
  ALLOW_RATED_R: 'allowRatedR',
  RECOMMENDATION_MODE: 'recommendationMode',
  CONTENT_MAX_RATING: 'contentMaxRating',
  BLOCK_MATURE_THEMES: 'blockMatureThemes',
  FORCE_LOCAL: 'forceLocal',
  CHANGELOG_VERSION: 'lastSeenChangelogVersion'
} as const;

export const DEFAULTS = {
  TURN_INDEX: 0,
  THEME: 'modern-pinnacle' as const,
  CAST_APP_ID: (import.meta.env.VITE_CAST_APP_ID || 'EEFE3131') as string
};
