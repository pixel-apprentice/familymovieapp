import React, { useEffect, useState } from 'react';
import { Tv } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';

declare global {
    interface Window {
        chrome: any;
        cast: any;
        __onGCastApiAvailable: (isAvailable: boolean) => void;
    }
}

export function CastButton() {
    const { pushCouchState } = useData();
    const [castAvailable, setCastAvailable] = useState(false);
    const [isCasting, setIsCasting] = useState(false);

    useEffect(() => {
        window.__onGCastApiAvailable = (isAvailable: boolean) => {
            if (isAvailable) {
                setCastAvailable(true);
                const castContext = window.cast.framework.CastContext.getInstance();
                castContext.setOptions({
                    receiverApplicationId: import.meta.env.VITE_CAST_APP_ID || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                    autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGINAL_SCOPE
                });

                // Listen for session changes
                castContext.addEventListener(
                    window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
                    (event: any) => {
                        const state = event.sessionState;
                        if (state === 'SESSION_STARTED' || state === 'SESSION_RESUMED') {
                            setIsCasting(true);
                            // Broadcast current location to the TV
                            pushCouchState({
                                path: window.location.pathname,
                                timestamp: Date.now()
                            });
                        } else if (state === 'SESSION_ENDED') {
                            setIsCasting(false);
                        }
                    }
                );
            }
        };
    }, []);

    const handleCastClick = () => {
        hapticFeedback.medium();
        const castContext = window.cast.framework.CastContext.getInstance();
        castContext.requestSession();
    };

    if (!castAvailable) return null;

    return (
        <button
            onClick={handleCastClick}
            className={`p-2.5 md:p-3 rounded-xl border transition-all active:scale-95 touch-manipulation ${isCasting
                ? 'bg-theme-primary text-theme-base border-theme-primary shadow-lg animate-pulse'
                : 'bg-theme-base border-theme-border text-theme-muted hover:text-theme-primary'
                }`}
            title={isCasting ? "Casting to TV..." : "Cast to TV"}
        >
            <Tv size={18} />
        </button>
    );
}
