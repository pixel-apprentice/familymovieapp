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
    <div className="flex flex-row items-stretch gap-2 w-full">
      <form onSubmit={handleSearch} className="flex-[3] flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              theme === 'mooooovies' ? 'Title, genre, or vibe...' :
                theme === 'drive-in' ? 'Tune to title...' :
                  theme === 'blockbuster' ? 'Scan title...' :
                    theme === 'sci-fi-hologram' ? 'Query...' :
                      theme === 'golden-age' ? 'Script title...' :
                        'Search title, actor, or vibe...'
            }
            onFocus={(e) => {
              // Ensure the search bar is at the top of the viewport when focused (good for mobile keyboard)
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 300); // Small delay for keyboard animation
            }}
            className="w-full bg-theme-base border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all shadow-inner placeholder:opacity-50"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !query.trim()}
          onClick={() => hapticFeedback.light()}
          className="px-4 py-3 bg-theme-primary text-theme-base font-black rounded-xl hover:scale-105 transition-transform disabled:opacity-30 shadow-lg uppercase text-[10px] tracking-widest shrink-0"
        >
          {theme === 'mooooovies' ? 'Search' :
            theme === 'drive-in' ? 'Tune' :
              theme === 'blockbuster' ? 'Find' :
                theme === 'sci-fi-hologram' ? 'Scan' :
                  theme === 'golden-age' ? 'Run' :
                    'Search'}
        </motion.button>
      </form>

      <div className="flex-1 shrink-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.medium(); handleRecommend(); }}
          disabled={loading}
          className="w-full h-full px-4 bg-theme-accent text-theme-base font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
        >
          <span className="text-sm animate-pulse">✨</span>
          <span className="truncate">
            {theme === 'mooooovies' ? 'Surprise!' :
              theme === 'drive-in' ? 'Random!' :
                theme === 'blockbuster' ? 'Mystery!' :
                  theme === 'sci-fi-hologram' ? 'Transcribe!' :
                    theme === 'golden-age' ? 'Director\'s!' :
                      'Surprise!'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}