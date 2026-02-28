import React from 'react';
import { Movie, useData, FAMILY_COLORS } from '../contexts/DataContext';
import { RatingsPanel } from './RatingsPanel';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Trash2, Youtube } from 'lucide-react';

export const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const { markWatched, removeMovie } = useData();
  const { theme } = useTheme();

  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;
  const pickerColor = movie.pickedBy in FAMILY_COLORS ? FAMILY_COLORS[movie.pickedBy as keyof typeof FAMILY_COLORS] : 'currentColor';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className={`relative group bg-theme-surface rounded-[2rem] overflow-hidden border border-theme-border shadow-xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-theme-primary/30 flex flex-col ${
        theme === '8-bit-arcade' ? 'border-4 rounded-none' : ''
      } ${
        theme === 'golden-marquee' ? 'gold-frame rounded-xl overflow-visible' : ''
      } ${
        theme === 'enchanted-library' ? 'rounded-lg border-2' : ''
      }`}
    >
      {/* Golden Marquee Lights */}
      {theme === 'golden-marquee' && (
        <div className="absolute -inset-3 border-2 border-dashed border-yellow-500/30 rounded-xl pointer-events-none z-50 flex justify-between flex-col p-1">
           <div className="flex justify-between w-full h-full absolute inset-0 p-1">
              {[...Array(8)].map((_, i) => (
                <div key={`t-${i}`} className="w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_10px_#facc15] animate-pulse-glow" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
           </div>
        </div>
      )}

      {movie.poster_url ? (
        <div className={`relative aspect-[2/3] w-full overflow-hidden bg-theme-base ${theme === '8-bit-arcade' ? 'crt-curve' : ''}`}>
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_url}`} 
            alt={movie.title} 
            className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${theme === '8-bit-arcade' ? 'opacity-90 contrast-125' : ''}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-surface via-transparent to-transparent opacity-80" />
          
          {/* Cyber Scan Line */}
          {theme === 'cyber-command' && (
            <div className="absolute w-full h-1 bg-green-400/50 shadow-[0_0_15px_#4ade80] animate-scan-line pointer-events-none z-10" />
          )}

          {/* Galactic Bloom Overlay */}
          {theme === 'galactic-glow' && (
            <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay pointer-events-none" />
          )}
          
          {movie.status === 'wishlist' && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); removeMovie(movie.id); }}
                className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                title="Remove from Wishlist"
              >
                <Trash2 size={14} />
              </button>
              <span className={`bg-theme-primary text-theme-base text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${theme === 'cyber-command' ? 'plastic-btn' : ''}`}>
                Pending
              </span>
            </div>
          )}
          
          {/* Genre Badges */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-1">
              {movie.genres.slice(0, 3).map(genre => (
                <span key={genre} className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-white/10">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`aspect-[2/3] w-full bg-theme-base flex items-center justify-center border-b border-theme-border relative ${theme === '8-bit-arcade' ? 'crt-curve' : ''}`}>
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <span className="text-theme-muted font-black text-2xl opacity-30 uppercase tracking-[0.2em] px-8 text-center leading-tight">
            {movie.title}
          </span>
        </div>
      )}

      <div className="p-3 md:p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start gap-2 md:gap-4 mb-2 md:mb-4">
          <div className="space-y-0.5 md:space-y-1">
            <h3 className={`text-sm md:text-xl font-black leading-tight text-theme-text group-hover:text-theme-primary transition-colors ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
              {movie.title}
            </h3>
            {movie.date && (
              <p className="text-[8px] md:text-[10px] text-theme-muted font-mono uppercase tracking-widest">
                {movie.date}
              </p>
            )}
          </div>
          <div className={`flex flex-col items-end gap-0.5 ${theme === '8-bit-arcade' ? 'bg-theme-primary text-theme-base px-1.5 py-0.5' : ''}`}>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Picker</span>
            <span className="text-[10px] md:text-xs font-black" style={{ color: pickerColor }}>{movie.pickedBy}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <a 
            href={trailerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-surface border border-theme-border text-[10px] font-black uppercase tracking-widest hover:bg-theme-base transition-all"
          >
            <Youtube size={14} className="text-red-600" />
            Trailer
          </a>
        </div>

        {movie.status === 'wishlist' && (
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => markWatched(movie.id)}
            className={`mt-auto w-full py-2 md:py-4 rounded-xl md:rounded-2xl bg-theme-primary text-theme-base font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] transition-all hover:shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] relative overflow-hidden group/btn ${
              theme === '8-bit-arcade' ? 'rounded-none shadow-[2px_2px_0_#000]' : ''
            } ${
              theme === 'cyber-command' ? 'plastic-btn rounded-lg' : ''
            } ${
              theme === 'golden-marquee' ? 'ticket-stub bg-yellow-500 text-red-900' : ''
            }`}
          >
            <span className="relative z-10">Watched</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </motion.button>
        )}

        {movie.status === 'watched' && (
          <div className="mt-auto">
            <RatingsPanel movieId={movie.id} ratings={movie.ratings} />
          </div>
        )}
      </div>
    </motion.div>
  );
};



