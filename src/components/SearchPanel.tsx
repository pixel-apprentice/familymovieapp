import React, { useState } from 'react';
import { searchMovies, TMDBMovie, GENRE_MAP } from '../services/tmdb';
import { getVibeSearchTerms, getFamilyRecommendations } from '../services/gemini';
import { useData, TURN_ORDER } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { AddMovieModal } from './AddMovieModal';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { addMovie, currentTurnIndex, movies } = useData();
  const { theme } = useTheme();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchMovies(query);
    setResults(res);
    setLoading(false);
  };

  const handleVibeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;
    setLoading(true);
    const terms = await getVibeSearchTerms(vibe);
    if (terms.length > 0) {
      const res = await searchMovies(terms.join(' '));
      setResults(res);
    }
    setLoading(false);
  };

  const handleRecommend = async () => {
    setLoading(true);
    const currentUser = TURN_ORDER[currentTurnIndex];
    const history = movies.filter(m => m.status === 'watched' && m.ratings);
    const titles = await getFamilyRecommendations(history, currentUser);
    
    if (titles.length > 0) {
      const tmdbResults = await Promise.all(
        titles.map(async (title) => {
          const res = await searchMovies(title);
          return res[0]; // Take best match
        })
      );
      setResults(tmdbResults.filter(Boolean) as TMDBMovie[]);
    }
    setLoading(false);
  };

  const handleAdd = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
  };

  const handleMovieAdded = () => {
    if (selectedMovie) {
      setResults(results.filter(r => r.id !== selectedMovie.id));
      setSelectedMovie(null);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-8 bg-theme-surface rounded-[2.5rem] border-2 border-theme-border shadow-2xl relative overflow-hidden ${
      theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
    } ${
      theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
    }`}>
      {theme === 'neon-cyberpunk' && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-theme-primary animate-pulse" />
          <div className="absolute bottom-0 right-0 w-1 h-full bg-theme-primary opacity-20" />
        </>
      )}
      
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h2 className={`text-2xl font-black text-theme-primary uppercase tracking-tighter ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            {theme === 'neon-cyberpunk' ? 'Acquisition Protocol' : 'Find Movies'}
          </h2>
          <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">
            {theme === 'neon-cyberpunk' ? 'Search or describe your desired cinematic experience' : 'Search, describe a vibe, or get AI recommendations'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted">Direct Query</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Title, Actor..."
                className="flex-1 min-w-0 bg-theme-base border border-theme-border rounded-2xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all shadow-inner"
              />
              <button type="submit" disabled={loading} className="px-4 py-3 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-lg uppercase text-[10px] tracking-widest shrink-0">
                Search
              </button>
            </div>
          </form>

          <form onSubmit={handleVibeSearch} className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted flex items-center gap-2">
              <span className="text-theme-accent animate-twinkle">✨</span> {theme === 'neon-cyberpunk' ? 'Neural Vibe Analysis' : 'Vibe Search'}
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={vibe} 
                onChange={e => setVibe(e.target.value)} 
                placeholder="Describe a mood..."
                className="flex-1 min-w-0 bg-theme-base border border-theme-border rounded-2xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all shadow-inner"
              />
              <button type="submit" disabled={loading} className="px-4 py-3 bg-theme-accent text-theme-base font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-lg uppercase text-[10px] tracking-widest shrink-0">
                Analyze
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted flex items-center gap-2">
              <span className="text-theme-primary animate-pulse">🤖</span> AI Recommendations
            </label>
            <button 
              onClick={handleRecommend} 
              disabled={loading} 
              className="w-full py-3 px-4 bg-theme-surface border-2 border-theme-primary text-theme-primary font-black rounded-2xl hover:bg-theme-primary hover:text-theme-base transition-all disabled:opacity-50 shadow-lg uppercase text-xs tracking-widest flex items-center justify-center gap-2"
            >
              For {TURN_ORDER[currentTurnIndex]}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-theme-border border-t-theme-primary rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-theme-primary animate-pulse uppercase tracking-[0.5em]">Processing...</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{results.length} Results Found</span>
                <button 
                  onClick={() => setResults([])}
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
                  className="flex gap-4 p-4 bg-theme-base rounded-2xl border border-theme-border/50 hover:border-theme-primary transition-all group relative"
                >
                  {movie.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-16 h-24 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-24 bg-theme-surface rounded-xl flex items-center justify-center border border-theme-border">
                      <span className="text-[8px] text-theme-muted uppercase font-black">No Data</span>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col py-1">
                    <h4 className="font-black text-sm leading-tight mb-1 line-clamp-2 text-theme-text group-hover:text-theme-primary transition-colors">{movie.title}</h4>
                    <span className="text-[10px] text-theme-muted font-mono mb-2">{movie.release_date?.split('-')[0]}</span>
                    <button 
                      onClick={() => handleAdd(movie)}
                      className="mt-auto self-start text-[10px] font-black uppercase tracking-widest text-theme-primary hover:text-theme-accent transition-colors py-1 border-b border-transparent hover:border-theme-accent"
                    >
                      + Add Movie
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          )}
        </AnimatePresence>
      </div>

      {selectedMovie && (
        <AddMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAdded={handleMovieAdded}
        />
      )}
    </div>
  );
}

