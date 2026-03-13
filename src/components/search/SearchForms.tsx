import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticFeedback } from '../../utils/haptics';

interface SearchFormsProps {
  query: string;
  setQuery: (query: string) => void;
  vibe: string;
  setVibe: (vibe: string) => void;
  loading: boolean;
  handleSearch: (e: React.FormEvent) => void;
  handleVibeSearch: (e: React.FormEvent) => void;
  handleRecommend: () => void;
}

export function SearchForms({
  query,
  setQuery,
  loading,
  handleSearch,
  handleRecommend
}: Omit<SearchFormsProps, 'vibe' | 'setVibe' | 'handleVibeSearch'>) {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <form onSubmit={handleSearch} className="flex-1 space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted flex items-center gap-2">
          {theme === 'neon-cyberpunk' ? 'Neural Link Search' :
            theme === 'mooooovies' ? 'Smart Graze' :
              theme === 'drive-in' ? 'Universal Frequency' :
                theme === 'blockbuster' ? 'Master Catalog' :
                  theme === 'sci-fi-hologram' ? 'System Search' :
                    theme === 'golden-age' ? 'Global Archive' :
                      'Smart Search'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              theme === 'mooooovies' ? 'Title, genre, or vibe...' :
                theme === 'drive-in' ? 'Tune to title or mood...' :
                  theme === 'blockbuster' ? 'Scan title or genre...' :
                    theme === 'sci-fi-hologram' ? 'Query title or vibe...' :
                      theme === 'golden-age' ? 'Script title or style...' :
                        'Search title, actor, or vibe...'
            }
            className="flex-1 min-w-0 bg-theme-base border border-theme-border rounded-2xl px-4 py-4 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all shadow-inner placeholder:opacity-50"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !query.trim()}
            onClick={() => hapticFeedback.light()}
            className="px-6 py-4 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-30 shadow-lg uppercase text-[10px] tracking-widest shrink-0"
          >
            {theme === 'mooooovies' ? 'Search' :
              theme === 'drive-in' ? 'Tune' :
                theme === 'blockbuster' ? 'Find' :
                  theme === 'sci-fi-hologram' ? 'Scan' :
                    theme === 'golden-age' ? 'Run' :
                      'Search'}
          </motion.button>
        </div>
      </form>

      <div className="flex items-end shrink-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.medium(); handleRecommend(); }}
          disabled={loading}
          className="h-[58px] px-6 bg-theme-accent text-theme-base font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 md:min-w-[180px]"
        >
          <span className="text-lg animate-pulse">✨</span>
          {theme === 'mooooovies' ? 'Surprise!' :
            theme === 'drive-in' ? 'Random!' :
              theme === 'blockbuster' ? 'Mystery!' :
                theme === 'sci-fi-hologram' ? 'Transcribe!' :
                  theme === 'golden-age' ? 'Director\'s Pick!' :
                    'Surprise me!'}
        </motion.button>
      </div>
    </div>
  );
}