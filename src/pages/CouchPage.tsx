import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';

export function CouchPage() {
    const navigate = useNavigate();
    const { movies, couchState } = useData();

    useEffect(() => {
        // 1. Inject the Receiver SDK dynamically if not present
        if (!document.getElementById('cast-receiver-sdk')) {
            const script = document.createElement('script');
            script.id = 'cast-receiver-sdk';
            script.src = "https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js";
            document.head.appendChild(script);
        }

        // Set a flag so we know this device is a TV (Receiver)
        // ONLY persist if it's a real Chromecast or has the explicit param
        const isRealTV = window.navigator.userAgent.indexOf('CrKey') > -1;
        if (isRealTV) {
            import('../utils/isCouchMode').then(m => m.enableCouchMode());
        }

        let retryCount = 0;
        const maxRetries = 20; 
        const retryInterval = 400;

        const initSDK = () => {
            if (typeof window !== 'undefined' && 'cast' in window) {
                try {
                    const castFramework = (window as any).cast?.framework;
                    const context = castFramework?.CastReceiverContext?.getInstance();
                    if (context) {
                        context.start();
                        logger.log("[Couch Mode] Cast Receiver Context started.");
                        return true;
                    }
                } catch (error) {
                    logger.error("[Couch Mode] Failed to start Cast Receiver:", error);
                }
            }
            return false;
        };

        if (!initSDK()) {
            const timer = setInterval(() => {
                retryCount++;
                if (initSDK() || retryCount >= maxRetries) {
                    clearInterval(timer);
                }
            }, retryInterval);
            return () => clearInterval(timer);
        }
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
