import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ExternalLink, ChevronDown, ChevronUp as ChevronUpIcon } from 'lucide-react';
import { Movie } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';

interface MovieListRowProps {
    movie: Movie;
}

export const MovieListRow: React.FC<MovieListRowProps> = ({ movie }) => {
    const { updateMovie, profiles, markWatched } = useData();
    const [showRatings, setShowRatings] = useState(false);
    const profile = profiles.find(p => p.id === movie.pickedBy);
    const pickerColor = profile?.color || 'currentColor';

    const values = Object.values(movie.ratings).filter((r): r is number => typeof r === 'number' && r > 0);
    const avgRating = values.length > 0
        ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
        : 0;

    const handleRate = (memberId: string, rating: number) => {
        hapticFeedback.light();
        updateMovie(movie.id, { ratings: { ...movie.ratings, [memberId]: rating } });
    };

    const getPosterSrc = (url: string): string | null => {
        if (!url || url.trim() === '') return null;
        if (url.startsWith('http')) return url;
        return `https://image.tmdb.org/t/p/w200${url}`;
    };

    const posterSrc = movie.poster_url ? getPosterSrc(movie.poster_url) : null;

    return (
        <div className="p-3 bg-theme-surface rounded-2xl border border-theme-border hover:border-theme-primary/40 transition-colors">
            {/* Main row */}
            <div className="flex gap-3 items-center">
                {/* Poster */}
                <Link to={`/movie/${movie.id}`} className="shrink-0 block">
                    {posterSrc ? (
                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-xl shadow-md"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-10 h-14 sm:w-12 sm:h-16 bg-theme-base rounded-xl flex items-center justify-center border border-theme-border">
                            <span className="text-[7px] text-theme-muted font-black uppercase text-center px-0.5 leading-tight">
                                {movie.title.slice(0, 4)}
                            </span>
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <Link to={`/movie/${movie.id}`}>
                        <h3 className="font-black text-sm text-theme-text leading-tight line-clamp-2 hover:text-theme-primary transition-colors">
                            {movie.title}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap">
                        {movie.date && movie.date !== 'Unknown' && (
                            <span className="text-[10px] text-theme-muted font-mono">{movie.date.split('-')[0]}</span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: pickerColor }}>
                            {profile?.name || movie.pickedBy}
                        </span>
                        {movie.status === 'wishlist' && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-theme-primary/30 text-theme-primary bg-theme-primary/10">
                                Pending
                            </span>
                        )}
                    </div>

                    {/* Ratings toggle */}
                    {movie.status === 'watched' && (
                        <button
                            onClick={() => setShowRatings(v => !v)}
                            className="flex items-center gap-1 mt-0.5 w-fit touch-manipulation hover:text-theme-primary transition-colors text-theme-muted"
                        >
                            {avgRating > 0 ? (
                                <>
                                    <Star size={10} fill="currentColor" className="text-theme-primary" />
                                    <span className="text-[10px] font-black text-theme-primary">{avgRating}</span>
                                    <span className="text-[9px] ml-0.5">avg</span>
                                </>
                            ) : (
                                <span className="text-[9px] uppercase tracking-widest font-black">Rate this</span>
                            )}
                            {showRatings ? <ChevronUpIcon size={10} className="ml-0.5" /> : <ChevronDown size={10} className="ml-0.5" />}
                        </button>
                    )}
                </div>

                {/* Right actions */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                    <Link to={`/movie/${movie.id}`} className="text-theme-muted hover:text-theme-primary transition-colors p-1">
                        <ExternalLink size={13} />
                    </Link>
                    {movie.status === 'wishlist' && (
                        <button
                            onClick={() => { hapticFeedback.success(); markWatched(movie.id); }}
                            className="px-2.5 py-1.5 bg-theme-primary/10 text-theme-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-theme-primary hover:text-theme-base transition-all active:scale-95 touch-manipulation"
                        >
                            Watched
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded per-person ratings — renders below the row at full width */}
            {movie.status === 'watched' && showRatings && (
                <div className="mt-3 pt-3 border-t border-theme-border/30 flex flex-col gap-2">
                    {profiles.map(p => {
                        const filled = (star: number) => star <= (movie.ratings[p.id] || 0);
                        return (
                            <div key={p.id} className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase w-14 text-right shrink-0" style={{ color: p.color }}>
                                    {p.name}
                                </span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(p.id, star)}
                                            className="p-1.5 touch-manipulation active:scale-90 transition-transform"
                                            aria-label={`${p.name}: ${star} star`}
                                        >
                                            <Star
                                                size={16}
                                                fill={filled(star) ? p.color : 'none'}
                                                stroke={filled(star) ? p.color : 'currentColor'}
                                                className={filled(star) ? '' : 'text-theme-border'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
