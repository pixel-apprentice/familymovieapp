import React, { useEffect, useState } from 'react';
import { Tv } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLocation } from 'react-router-dom';
import { hapticFeedback } from '../utils/haptics';

declare global {
    interface Window {
        chrome: any;
        cast: any;
        __onGCastApiAvailable: (isAvailable: boolean) => void;
    }
}

export function CastButton() {
    const { movies, pushCouchState } = useData();
    const location = useLocation();
    const [castAvailable, setCastAvailable] = useState(false);
    const [isCasting, setIsCasting] = useState(false);

    const hasCustomReceiver = !!import.meta.env.VITE_CAST_APP_ID;

    useEffect(() => {
        const initializeCast = (isAvailable: boolean) => {
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

        // Set the global callback for future changes
        window.__onGCastApiAvailable = initializeCast;

        // Check if the API is already available right now
        // Sometimes the SDK loads before the React component mounts
        if (typeof window !== 'undefined' && window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
            initializeCast(true);
        }
    }, []);

    // Fallback: If no custom receiver is set, we stream visual representations (posters) manually using the Default Media Receiver
    useEffect(() => {
        if (!isCasting || hasCustomReceiver) return;

        const session = window.cast?.framework?.CastContext?.getInstance()?.getCurrentSession();
        if (!session) return;

        let mediaInfo: any = null;
        const movieId = location.pathname.split('/movie/')[1];

        if (movieId) {
            const movie = movies.find(m => m.id === movieId);
            if (movie && movie.poster_url) {
                const imgUrl = movie.poster_url.startsWith('http') ? movie.poster_url : `https://image.tmdb.org/t/p/w500${movie.poster_url}`;
                mediaInfo = new window.chrome.cast.media.MediaInfo(imgUrl, 'image/jpeg');
                mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
                mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
                mediaInfo.metadata.title = movie.title;
                mediaInfo.metadata.subtitle = movie.summary ? movie.summary.substring(0, 100) + '...' : 'Movie Night';
                mediaInfo.metadata.images = [{ url: imgUrl }];
            }
        } else {
            // Home page fallback: cast the app icon
            const pwaIcon = window.location.origin + '/pwa-512.png';
            mediaInfo = new window.chrome.cast.media.MediaInfo(pwaIcon, 'image/png');
            mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
            mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
            mediaInfo.metadata.title = "Family Movie Night";
            mediaInfo.metadata.images = [{ url: pwaIcon }];
        }

        if (mediaInfo) {
            const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
            // Autoplay is true by default, so images display indefinitely
            session.loadMedia(request).catch((err: any) => console.log('Cast media load fallback errored:', err));
        }
    }, [isCasting, location.pathname, movies, hasCustomReceiver]);

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
