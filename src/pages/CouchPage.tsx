import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

export function CouchPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Inject the Receiver SDK dynamically if not present
        if (!document.getElementById('cast-receiver-sdk')) {
            const script = document.createElement('script');
            script.id = 'cast-receiver-sdk';
            script.src = "https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js";
            document.head.appendChild(script);
        }

        // Set a flag so we know this device is a TV (Receiver)
        import('../utils/isCouchMode').then(m => m.enableCouchMode());

        let retryCount = 0;
        const maxRetries = 20; // 8 seconds total (20 * 400ms)
        const retryInterval = 400;

        const initSDK = () => {
            if (typeof window !== 'undefined' && 'cast' in window) {
                try {
                    const castFramework = (window as any).cast?.framework;
                    const context = castFramework?.CastReceiverContext?.getInstance();
                    if (context) {
                        context.start();
                        logger.log("[Couch Mode] Cast Receiver Context started.");
                        
                        // Small delay to let the underlying WebSocket stabilize
                        // But now we know the SDK is at least started.
                        setTimeout(() => navigate('/?couch=true', { replace: true }), 300);
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
                    if (retryCount >= maxRetries) {
                        logger.warn("[Couch Mode] Cast SDK not found after retries. Manual navigation fall-through.");
                        navigate('/?couch=true', { replace: true });
                    }
                }
            }, retryInterval);
            return () => clearInterval(timer);
        }
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
