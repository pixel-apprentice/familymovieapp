import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';

export function CouchPage() {
    const navigate = useNavigate();
    const { movies, couchState } = useData();

    useEffect(() => {
        // Set a flag so we know this device is a TV (Receiver)
        // This persists so that even if we navigate to /tv/movie/:id, 
        // the app knows it's a TV without checking the URL constantly.
        import('../utils/isCouchMode').then(m => m.enableCouchMode());
    }, []);

    // Ambient Mode Timer: If no movie is selected after 5 minutes, cycle through top picks
    useEffect(() => {
        const AMBIENT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        
        const timer = setTimeout(() => {
            if (movies.length > 0) {
                // Find movies with high ratings or just random unwatched ones
                const candidates = movies.filter(m => m.status === 'wishlist' || Object.keys(m.ratings).length > 0);
                const randomMovie = candidates[Math.floor(Math.random() * candidates.length)];
                
                if (randomMovie) {
                    logger.log("[Couch Mode] Entering Ambient Mode. Showing:", randomMovie.title);
                    navigate(`/movie/${randomMovie.id}`);
                }
            }
        }, AMBIENT_TIMEOUT);

        return () => clearTimeout(timer);
    }, [couchState?.timestamp, movies, navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-theme-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(var(--color-primary),0.3)]" />
                <div className="text-center space-y-2">
                    <p className="text-theme-primary font-black uppercase tracking-[0.4em] text-sm animate-pulse">
                        Waiting for Phone...
                    </p>
                    <p className="text-theme-muted/50 text-[10px] font-mono uppercase tracking-widest">
                        Couch Mode V2: Cinematic Billboard
                    </p>
                </div>
            </div>
        </div>
    );
}
