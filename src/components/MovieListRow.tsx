import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Movie } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';

interface MovieListRowProps {
    movie: Movie;
}

export const MovieListRow: React.FC<MovieListRowProps> = ({ movie }) => {
    const { profiles, markWatched } = useData();
    const profile = profiles.find(p => p.id === movie.pickedBy);
    const pickerColor = profile?.color || 'currentColor';

    const avgRating = (() => {
        const values = Object.values(movie.ratings).filter((r): r is number => typeof r === 'number' && r > 0);
        return values.length > 0
            ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
            : 0;
    })();

    const getPosterSrc = (url: string): string | null => {
        if (!url || url.trim() === '') return null;
        if (url.startsWith('http')) return url;
        return `https://image.tmdb.org/t/p/w200${url}`;
    };

    const posterSrc = movie.poster_url ? getPosterSrc(movie.poster_url) : null;

    return (
        <div className="py-3 bg-transparent border-b border-theme-border group hover:bg-theme-surface/30 transition-colors first:border-t-0 last:border-b-0 px-2 sm:px-4">
            <div className="flex gap-4 items-center">
                {/* Poster - Kept at 64px tall (h-16) as requested */}
                <Link to={`/movie/${movie.id}`} className="shrink-0 block">
                    {posterSrc ? (
                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-12 h-16 bg-theme-base rounded-lg flex items-center justify-center border border-theme-border shadow-sm group-hover:shadow-md transition-shadow">
                            <span className="text-[7px] text-theme-muted font-black uppercase text-center px-0.5 leading-tight">
                                {movie.title.slice(0, 4)}
                            </span>
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
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
                        {avgRating > 0 && (
                            <span className="text-[10px] text-theme-muted font-mono text-theme-primary">★ {avgRating}</span>
                        )}
                        {movie.status === 'wishlist' && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-theme-primary/30 text-theme-primary bg-theme-primary/10">
                                Pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-3 pr-2">
                    {movie.status === 'wishlist' && (
                        <button
                            onClick={() => { hapticFeedback.success(); markWatched(movie.id); }}
                            className="px-2.5 py-1.5 bg-theme-primary/10 text-theme-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-theme-primary hover:text-theme-base transition-all active:scale-95 touch-manipulation opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100"
                        >
                            Watched
                        </button>
                    )}
                    <Link to={`/movie/${movie.id}`} className="text-theme-muted hover:text-theme-primary transition-colors p-2 -mr-2">
                        <ExternalLink size={15} />
                    </Link>
                </div>
            </div>
        </div>
    );
};
