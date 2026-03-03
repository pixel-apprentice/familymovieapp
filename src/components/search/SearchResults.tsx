import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMovie } from '../../services/tmdb';
import { hapticFeedback } from '../../utils/haptics';

interface SearchResultsProps {
  results: TMDBMovie[];
  setResults: (results: TMDBMovie[]) => void;
  handleAdd: (movie: TMDBMovie) => void;
}

export function SearchResults({ results, setResults, handleAdd }: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{results.length} Results Found</span>
          <button 
            onClick={() => { hapticFeedback.light(); setResults([]); }}
            className="text-[10px] font-black uppercase tracking-widest text-theme-primary hover:text-theme-accent transition-colors"
          >
            Clear Results
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
              onClick={() => { hapticFeedback.light(); handleAdd(movie); }}
              className="flex gap-4 p-4 bg-theme-base rounded-2xl border border-theme-border/50 hover:border-theme-primary transition-all group relative cursor-pointer"
            >
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
                <div className="mt-auto self-start text-[10px] font-black uppercase tracking-widest text-theme-primary hover:text-theme-accent transition-colors py-1 border-b border-transparent hover:border-theme-accent">
                  + Add Movie
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}