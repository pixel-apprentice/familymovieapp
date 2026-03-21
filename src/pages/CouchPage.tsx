import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';
import { enableCouchMode } from '../utils/isCouchMode';

export function CouchPage() {
    const navigate = useNavigate();
    const { movies, couchState } = useData();

    useEffect(() => {
        // Synchronously mark this device as a TV receiver immediately on mount.
        // Previously used a dynamic import, which meant the first render could
        // complete before the flag was set — causing the phone nav bar to flash.
        enableCouchMode();
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden font-['Outfit']">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
            </div>

            <div className="flex flex-col items-center gap-12 relative z-10">
                {/* Advanced Pulsing Ring Loader */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border border-theme-primary/20 animate-[ping_3s_infinite]" />
                    <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-theme-primary animate-[pulse_2s_infinite] shadow-[0_0_50px_rgba(56,189,248,0.3)]" />
                    <div className="absolute inset-4 rounded-full border border-theme-primary/40 animate-[spin_10s_linear_infinite]" />
                </div>

                <div className="text-center space-y-6 max-w-2xl px-12">
                    <div className="space-y-1">
                        <h1 className="text-theme-primary font-black uppercase tracking-[0.6em] text-2xl animate-pulse">
                            TV Mode Active
                        </h1>
                        <p className="text-theme-muted/40 text-xs font-mono uppercase tracking-[0.3em]">
                            Waiting for cast signal from phone
                        </p>
                    </div>

                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-theme-primary/30 to-transparent mx-auto" />

                    <div className="space-y-3 opacity-30 group hover:opacity-100 transition-opacity">
                        <p className="text-theme-muted text-[10px] uppercase font-black tracking-widest leading-loose">
                            Open the app on your mobile device<br />
                            and tap a movie to start the show
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Version Branding */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10">
                <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white">
                    Family Movie Night • Cinematic Receiver v2.1
                </span>
            </div>
        </div>
    );
}
