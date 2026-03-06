import React from 'react';
import { Movie, useData } from '../contexts/DataContext';
import { RatingsPanel } from './RatingsPanel';
import { useTheme, useThemeText } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Trash2, Youtube, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hapticFeedback } from '../utils/haptics';

export const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const { markWatched, removeMovie, profiles } = useData();
  const { theme } = useTheme();
  const getThemeText = useThemeText();

  const trailerUrl = movie.trailerKey
    ? `https://www.youtube.com/watch?v=${movie.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;
  const profile = profiles.find(p => p.id === movie.pickedBy);
  const pickerColor = profile ? profile.color : 'currentColor';
  const pickerName = profile ? profile.name : movie.pickedBy;

  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className={`relative group bg-theme-surface rounded-[2rem] overflow-hidden border border-theme-border shadow-xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-theme-primary/30 flex flex-col ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
        } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]' : ''
        } ${theme === 'vintage-ticket' ? 'rounded-xl overflow-visible' : ''
        }`}
    >
      <Link to={`/movie/${movie.id}`} className="block relative group/poster">
        {movie.poster_url && movie.poster_url.trim() !== '' && !imageError ? (
          <div className={`relative aspect-[2/3] w-full overflow-hidden bg-theme-base`}>
            <img
              src={movie.poster_url.startsWith('http') ? movie.poster_url : `https://image.tmdb.org/t/p/w500${movie.poster_url}`}
              alt={movie.title}
              className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-theme-surface via-transparent to-transparent opacity-80" />

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-30">
              <div className="bg-white text-black p-3 rounded-full shadow-2xl transform scale-50 group-hover/poster:scale-100 transition-transform duration-300">
                <ExternalLink size={24} />
              </div>
            </div>

            {movie.status === 'wishlist' && (
              <div className="absolute top-4 right-4 z-40 flex gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticFeedback.medium(); removeMovie(movie.id); }}
                  className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={14} />
                </button>
                <span className={`bg-theme-primary text-theme-base text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg`}>
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
          <div className={`aspect-[2/3] w-full bg-theme-base flex items-center justify-center border-b border-theme-border relative`}>
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <span className="text-theme-muted font-black text-2xl opacity-30 uppercase tracking-[0.2em] px-8 text-center leading-tight">
              {movie.title}
            </span>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-30">
              <div className="bg-white text-black p-3 rounded-full shadow-2xl transform scale-50 group-hover/poster:scale-100 transition-transform duration-300">
                <ExternalLink size={24} />
              </div>
            </div>
          </div>
        )}
      </Link>

      <div className="p-3 md:p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start gap-2 md:gap-4 mb-2 md:mb-4">
          <div className="space-y-0.5 md:space-y-1">
            <Link to={`/movie/${movie.id}`} className="hover:underline">
              <h3 className={`text-sm md:text-xl font-black leading-tight text-theme-text group-hover:text-theme-primary transition-colors ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                {movie.title}
              </h3>
            </Link>
            {movie.date && (
              <p className="text-[8px] md:text-[10px] text-theme-muted font-mono uppercase tracking-widest">
                {movie.date}
              </p>
            )}
          </div>
          <div className={`flex flex-col items-end gap-0.5`}>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Picker</span>
            <span className="text-[10px] md:text-xs font-black" style={{ color: pickerColor }}>{pickerName}</span>
          </div>
        </div>

        {movie.status === 'wishlist' && (
          <div className="flex gap-2 mb-4">
            <motion.a
              whileTap={{ scale: 0.95 }}
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticFeedback.light()}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-surface border border-theme-border text-[10px] font-black uppercase tracking-widest hover:bg-theme-base transition-all"
            >
              <Youtube size={14} className="text-red-600" />
              Trailer
            </motion.a>
          </div>
        )}

        {movie.status === 'wishlist' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticFeedback.success(); markWatched(movie.id); }}
            className={`mt-auto w-full py-2 md:py-4 rounded-xl md:rounded-2xl bg-theme-primary text-theme-base font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] transition-all hover:shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] relative overflow-hidden group/btn ${theme === 'modern-pinnacle' ? 'rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.2)]' : ''
              } ${theme === 'modern-luminous' ? 'rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]' : ''
              } ${theme === 'vintage-ticket' ? 'ticket-stub bg-amber-600 text-amber-50' : ''
              }`}
          >
            <span className="relative z-10">
              {getThemeText('watched')}
            </span>
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



