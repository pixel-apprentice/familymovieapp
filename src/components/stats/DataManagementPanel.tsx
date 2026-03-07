import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Database, ImageOff, RefreshCw } from 'lucide-react';
import { hapticFeedback } from '../../utils/haptics';
import { toast } from 'sonner';

export function DataManagementPanel() {
    const { movies, refreshMetadata } = useData();
    const { theme } = useTheme();
    const [isRefreshingPosters, setIsRefreshingPosters] = useState(false);

    const missingPosterCount = useMemo(
        () => movies.filter(m => !m.poster_url || m.poster_url.trim() === '').length,
        [movies]
    );

    const handleRefreshAllPosters = async () => {
        hapticFeedback.medium();
        setIsRefreshingPosters(true);
        try {
            await refreshMetadata(true);
            toast.success('Posters refreshed!');
        } catch {
            toast.error('Some posters could not be loaded.');
        } finally {
            setIsRefreshingPosters(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                    {theme === 'mooooovies' ? 'Pasture Management' :
                     theme === 'drive-in' ? 'Lot Management' :
                     theme === 'blockbuster' ? 'Inventory Management' :
                     theme === 'sci-fi-hologram' ? 'Data Management' :
                     theme === 'golden-age' ? 'Archive Management' :
                     'Data Management'}
                </h2>
                <div className="h-px flex-1 bg-theme-border/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Poster Refresh Tile */}
                <div className="bg-theme-surface/50 border border-theme-border rounded-[2rem] p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-theme-primary">
                        <Database size={24} />
                        <h3 className="font-black uppercase tracking-widest text-sm">
                            {theme === 'mooooovies' ? 'Movie Posters' :
                             theme === 'drive-in' ? 'Feature Posters' :
                             theme === 'blockbuster' ? 'Tape Covers' :
                             theme === 'sci-fi-hologram' ? 'Holo-Covers' :
                             theme === 'golden-age' ? 'Playbills' :
                             'Movie Posters'}
                        </h3>
                    </div>
                    <p className="text-xs text-theme-muted font-mono leading-relaxed flex-1">
                        {theme === 'mooooovies' ? 'Refreshing poster metadata across the whole pasture. TMDB is used to fetch high-quality movie posters.' :
                         theme === 'drive-in' ? 'Refreshing poster metadata across the whole lot. TMDB is used to fetch high-quality movie posters.' :
                         theme === 'blockbuster' ? 'Refreshing poster metadata across the whole shelf. TMDB is used to fetch high-quality movie posters.' :
                         theme === 'sci-fi-hologram' ? 'Refreshing poster metadata across the full databank. TMDB is used to fetch high-quality movie posters.' :
                         theme === 'golden-age' ? 'Refreshing poster metadata across the full archive. TMDB is used to fetch high-quality movie posters.' :
                         'Refreshing poster metadata across your whole library. TMDB is used to fetch high-quality movie posters.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-theme-base rounded-2xl border border-theme-border/50">
                        <div className="flex items-center gap-2">
                            <ImageOff size={16} className={missingPosterCount > 0 ? 'text-amber-500' : 'text-theme-muted opacity-50'} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${missingPosterCount > 0 ? 'text-amber-500' : 'text-theme-muted opacity-50'}`}>
                                {missingPosterCount} Missing
                            </span>
                        </div>
                        <button
                            onClick={handleRefreshAllPosters}
                            disabled={isRefreshingPosters}
                            className="px-4 py-2 bg-theme-primary text-theme-base font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <RefreshCw size={12} className={isRefreshingPosters ? 'animate-spin' : ''} />
                            {isRefreshingPosters ? 'Fetching...' : 'Refresh All'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
