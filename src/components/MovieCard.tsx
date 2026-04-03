import React from 'react';
import { Movie, useData } from '../contexts/DataContext';
import { useTheme, useThemeText } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Trash2, Youtube, ExternalLink, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { hapticFeedback } from '../utils/haptics';
import { isCouchModeEnabled } from '../utils/isCouchMode';

interface MovieCardInnerProps {
  movie: Movie;
  markWatched: (id: string) => void;
  removeMovie: (id: string) => void;
  profiles: any[];
  theme: string;
  getThemeText: (key: string) => string;
  isCouchMode: boolean;
}

const MovieCardInner = React.memo(({ movie, markWatched, removeMovie, profiles, theme, getThemeText, isCouchMode }: MovieCardInnerProps) => {
  const [imageError, setImageError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const trailerUrl = movie.trailerKey
    ? `https://www.youtube.com/watch?v=${movie.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;

  const profile = profiles.find(p => p.id === movie.pickedBy);
  const pickerColor = profile ? profile.color : 'currentColor';
  const pickerName = profile ? profile.name : movie.pickedBy;

  const calculateAverageRating = (ratings: Movie['ratings']) => {
    const values = Object.values(ratings).filter((r): r is number => typeof r === 'number' && r > 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const familyRating = calculateAverageRating(movie.ratings);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className={`relative group bg-theme-surface rounded-2xl overflow-hidden border border-theme-border shadow-md transition-all duration-500 hover:shadow-2xl hover:border-theme-primary/30 flex flex-col ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 bg-white/[0.02]' : ''
        } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 bg-black/[0.02]' : ''} ${theme === 'vintage-ticket' ? 'rounded-xl overflow-visible' : ''
        }`}
      data-testid="movie-card"
    >
      <Link to={`/movie/${movie.id}`} className="block relative group/poster">
        {movie.poster_url && movie.poster_url.trim() !== '' && !imageError ? (
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-theme-surface">
            {/* Shimmer skeleton — always reserves space, fades out when image loads */}
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-theme-surface via-theme-border/20 to-theme-surface" />
            )}
            <img
              src={movie.poster_url.startsWith('http') ? movie.poster_url : `https://image.tmdb.org/t/p/w500${movie.poster_url}`}
              alt={movie.title}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-30">
              <div className="bg-white text-black p-2 rounded-full shadow-2xl transform scale-50 group-hover/poster:scale-100 transition-transform duration-300">
                <ExternalLink size={18} />
              </div>
            </div>

            {/* Top Right Actions / Rating */}
            <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-2 text-white">
              {movie.status === 'wishlist' && !isCouchMode && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticFeedback.medium(); removeMovie(movie.id); }}
                  className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              )}

              {movie.status === 'watched' && Number(familyRating) > 0 && (
                <div className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-xl">
                  <Star 
                    size={10} 
                    className="text-amber-400" 
                    fill={Number(familyRating) % 1 !== 0 ? 'url(#halfStarDetail)' : 'currentColor'} 
                  />
                  <span className="text-[10px] font-black uppercase tracking-tight">{familyRating}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-[2/3] w-full bg-gradient-to-br from-theme-surface to-theme-base flex items-center justify-center relative animate-pulse">
            <span className="text-theme-muted font-black text-[10px] opacity-30 uppercase tracking-widest px-4 text-center">
              {movie.title}
            </span>
          </div>
        )}
      </Link>

      <div className="p-2 md:p-3 flex-1 flex flex-col relative z-10">
        <div className="flex flex-col gap-1 mb-2">
          <Link to={`/movie/${movie.id}`} className="hover:underline">
            <h3 className={`text-xs md:text-base font-black leading-tight text-theme-text group-hover:text-theme-primary transition-colors line-clamp-2 ${theme === 'vintage-ticket' ? 'font-serif italic text-sm' : ''
              } ${isCouchMode ? 'text-2xl' : ''}`}>
              {movie.title}
            </h3>
          </Link>
          <div className="flex items-center justify-between gap-2">
            <span className={`font-black uppercase ${isCouchMode ? 'text-lg' : 'text-[9px] md:text-xs'}`} style={{ color: pickerColor }}>{pickerName}</span>
            {movie.date && (
              <span className={`text-theme-muted font-mono uppercase tracking-widest ${isCouchMode ? 'text-sm' : 'text-[7px] md:text-[9px]'}`}>
                {movie.date.split('-')[0]}
              </span>
            )}
          </div>
        </div>

        {movie.status === 'wishlist' && !isCouchMode && (
          <div className="mt-auto space-y-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { hapticFeedback.success(); markWatched(movie.id); }}
              className="w-full py-1.5 rounded-lg bg-theme-primary text-theme-base font-black uppercase tracking-widest text-[8px] transition-all hover:shadow-lg relative overflow-hidden group/btn touch-manipulation"
            >
              <span className="relative z-10">{getThemeText('watched')}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            </motion.button>

            <a
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticFeedback.light()}
              className="w-full flex items-center justify-center gap-1 py-1 rounded-lg border border-theme-border text-[8px] font-black uppercase tracking-widest hover:bg-theme-base transition-all text-theme-muted"
            >
              <Youtube size={10} className="text-red-600" />
              Trailer
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.movie === nextProps.movie &&
    prevProps.theme === nextProps.theme &&
    prevProps.isCouchMode === nextProps.isCouchMode
  );
});

export const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const { markWatched, removeMovie, profiles } = useData();
  const { theme } = useTheme();
  const getThemeText = useThemeText();
  const location = useLocation();
  const isCouchMode = isCouchModeEnabled(location.search);

  return (
    <MovieCardInner 
      movie={movie} 
      markWatched={markWatched} 
      removeMovie={removeMovie} 
      profiles={profiles} 
      theme={theme} 
      getThemeText={getThemeText} 
      isCouchMode={isCouchMode} 
    />
  );
};
