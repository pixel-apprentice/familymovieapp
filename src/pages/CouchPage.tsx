import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

export function CouchPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Set a flag in session storage so we know this device is a TV (Receiver)
        sessionStorage.setItem('fmn_couch_mode', 'true');

        // Initialize Cast Receiver SDK if available
        if (typeof window !== 'undefined' && 'cast' in window) {
            try {
                // @ts-expect-error - Receiver SDK types are not in @types/chromecast-caf-sender
                const context = window.cast?.framework?.CastReceiverContext?.getInstance();
                if (context) {
                    context.start();
                    logger.log("[Couch Mode] Cast Receiver Context started.");
                }
            } catch (error) {
                logger.error("[Couch Mode] Failed to start Cast Receiver:", error);
            }
        }

        // Use client-side navigation to preserve the Cast Context!
        // We add a slight delay to ensure the Receiver Context handshake completes
        const timer = setTimeout(() => {
            navigate('/', { replace: true });
        }, 500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-theme-primary font-black uppercase tracking-widest text-sm animate-pulse">
                    Initializing Couch Mode...
                </p>
            </div>
        </div>
    );
}
