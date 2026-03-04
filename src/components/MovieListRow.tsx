import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, ExternalLink } from 'lucide-react';
import { Movie, FamilyProfile } from '../contexts/DataContext';
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
    const values = (Object.values(movie.ratings) as number[]).filter((r: number) => r > 0);
    const avgRating = values.length > 0 ? parseFloat((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)) : 0;

    const handleRate = (memberId: string, rating: number) => {
        hapticFeedback.light();
        updateMovie(movie.id, { ratings: { ...movie.ratings, [memberId]: rating } });
    };

    const getPosterSrc = (url: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `https://image.tmdb.org/t/p/w200${url}`;
    };

    const posterSrc = movie.poster_url ? getPosterSrc(movie.poster_url) : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex gap-4 p-3 bg-theme-surface rounded-2xl border border-theme-border hover:border-theme-primary/40 transition-all group"
        >
            {/* Poster thumbnail */}
            <Link to={`/movie/${movie.id}`} className="shrink-0">
                {posterSrc ? (
                    <img
                        src={posterSrc}
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-12 h-16 bg-theme-base rounded-xl flex items-center justify-center border border-theme-border">
                        <span className="text-[8px] text-theme-muted font-black uppercase text-center px-1 leading-tight">{movie.title.slice(0, 4)}</span>
                    </div>
                )}
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-start justify-between gap-2">
                    <Link to={`/movie/${movie.id}`} className="hover:text-theme-primary transition-colors">
                        <h3 className="font-black text-sm text-theme-text leading-tight line-clamp-1">{movie.title}</h3>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                        {movie.date && (
                            <span className="text-[10px] text-theme-muted font-mono">{movie.date?.split('-')[0]}</span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: pickerColor }}>
                            {profile?.name || movie.pickedBy}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Avg star rating pill */}
                    {movie.status === 'watched' && avgRating > 0 && (
                        <button
                            onClick={() => setShowRatings(v => !v)}
                            className="flex items-center gap-1 text-theme-primary hover:text-theme-accent transition-colors"
                        >
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-black">{avgRating}</span>
                        </button>
                    )}
                    {movie.status === 'wishlist' && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/30 text-amber-500 bg-amber-500/10">
                            Wishlist
                        </span>
                    )}
                    <Link
                        to={`/movie/${movie.id}`}
                        className="ml-auto text-theme-muted hover:text-theme-primary transition-colors"
                    >
                        <ExternalLink size={12} />
                    </Link>
                </div>
            </div>

            {/* Inline ratings — toggled or always shown for watched */}
            {movie.status === 'watched' && showRatings && (
                <div className="shrink-0 flex flex-col justify-center gap-1 border-l border-theme-border/30 pl-4">
                    {profiles.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase w-10 text-right" style={{ color: p.color }}>{p.name}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(p.id, star)}
                                        className="p-0.5 hover:scale-125 transition-transform"
                                    >
                                        <Star
                                            size={10}
                                            fill={star <= (movie.ratings[p.id] || 0) ? p.color : 'none'}
                                            stroke={star <= (movie.ratings[p.id] || 0) ? p.color : 'currentColor'}
                                            className="text-theme-muted"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Watched CTA for wishlist */}
            {movie.status === 'wishlist' && (
                <div className="shrink-0 flex items-center">
                    <button
                        onClick={() => { hapticFeedback.success(); markWatched(movie.id); }}
                        className="px-3 py-2 bg-theme-primary/10 text-theme-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary hover:text-theme-base transition-all"
                    >
                        Watched
                    </button>
                </div>
            )}
        </motion.div>
    );
}
