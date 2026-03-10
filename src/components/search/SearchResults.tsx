import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMovie } from '../../services/tmdb';
import { hapticFeedback } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

interface SearchResultsProps {
  results: TMDBMovie[];
  setResults: (results: TMDBMovie[]) => void;
  handleAdd: (movie: TMDBMovie) => void;
  handleQuickAdd: (movie: TMDBMovie) => void;
}

export function SearchResults({ results, setResults, handleAdd, handleQuickAdd }: SearchResultsProps) {
  const { theme } = useTheme();
  if (results.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
            {results.length} {
              theme === 'mooooovies' ? 'Pastures Found' :
                theme === 'drive-in' ? 'Frequencies Found' :
                  theme === 'blockbuster' ? 'Tapes Found' :
                    theme === 'sci-fi-hologram' ? 'Logs Found' :
                      theme === 'golden-age' ? 'Scripts Found' :
                        'Results Found'
            }
          </span>
          <button
            onClick={() => { hapticFeedback.light(); setResults([]); }}
            className="text-[10px] font-black uppercase tracking-widest text-theme-primary hover:text-theme-accent transition-colors"
          >
            {theme === 'mooooovies' ? 'Clear Pasture' :
              theme === 'drive-in' ? 'Clear Screen' :
                theme === 'blockbuster' ? 'Return Tapes' :
                  theme === 'sci-fi-hologram' ? 'Purge Data' :
                    theme === 'golden-age' ? 'Clear Stage' :
                      'Clear Results'}
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar"
        >
          {results.map((movie, idx) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                if (movie.isExisting) {
                  toast.info(`"${movie.title}" is already in your library!`);
                  return;
                }
                hapticFeedback.light();
                handleAdd(movie);
              }}
              className={`flex gap-4 p-4 bg-theme-base rounded-2xl border transition-all group relative cursor-pointer ${movie.isExisting ? 'grayscale-[0.6] opacity-80' : 'border-theme-border/50 hover:border-theme-primary'
                }`}
            >
              {movie.isExisting && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-theme-muted text-theme-base rounded-full text-[8px] font-black uppercase tracking-tighter z-10">
                  In Library
                </div>
              )}
              {movie.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-16 h-24 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-24 bg-theme-surface rounded-xl flex items-center justify-center border border-theme-border shrink-0">
                  <span className="text-[8px] text-theme-muted uppercase font-black">No Data</span>
                </div>
              )}
              <div className="flex-1 flex flex-col py-1 min-w-0">
                <h4 className="font-black text-sm leading-tight mb-1 line-clamp-2 text-theme-text group-hover:text-theme-primary transition-colors">{movie.title}</h4>
                <span className="text-[10px] text-theme-muted font-mono mb-2">{movie.release_date?.split('-')[0]}</span>
                {movie.reason && (
                  <p className="text-[10px] text-theme-muted italic line-clamp-3 leading-snug mb-2">{movie.reason}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className={`text-[10px] font-black uppercase tracking-widest transition-colors py-1 border-b border-transparent ${movie.isExisting ? 'text-theme-muted' : 'text-theme-primary hover:text-theme-accent hover:border-theme-accent'
                    }`}>
                    {movie.isExisting ? 'Already Added' :
                      `Details ${theme === 'blockbuster' ? '& Tape' : ''}`}
                  </div>
                  {!movie.isExisting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(movie);
                      }}
                      className="p-2 bg-theme-primary text-theme-base rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
                      title="Quick Add"
                    >
                      <span className="text-sm font-bold">+</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}