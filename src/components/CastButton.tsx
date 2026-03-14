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
                const appId = import.meta.env.VITE_CAST_APP_ID || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;

                // Properly configure session request to hint for video-capable devices (TVs)
                const sessionRequest = new window.chrome.cast.SessionRequest(appId);
                sessionRequest.capabilities = [window.chrome.cast.Capability.VIDEO_OUT];

                castContext.setOptions({
                    receiverApplicationId: appId,
                    autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGINAL_SCOPE,
                    sessionRequest: sessionRequest
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
                
                // Calculate average rating for the TV display
                const ratings = Object.values(movie.ratings || {}).filter((r): r is number => typeof r === 'number' && r > 0);
                const avgRating = ratings.length > 0 
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : null;

                const statusText = movie.status === 'watched' ? 'Watched' : 'Wishlist';
                const pickedByText = movie.pickedBy || 'Family';
                const subtitle = `${statusText} • Picked by ${pickedByText}${avgRating ? ` • Rating: ${avgRating}★` : ''}`;

                mediaInfo = new window.chrome.cast.media.MediaInfo(imgUrl, 'image/jpeg');
                mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
                mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
                mediaInfo.metadata.title = movie.title;
                mediaInfo.metadata.subtitle = subtitle;
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation text-[10px] font-black uppercase tracking-widest ${isCasting
                ? 'bg-theme-primary text-theme-base shadow-lg animate-pulse'
                : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
            title={isCasting ? "Casting to TV..." : "Cast to TV"}
        >
            <Tv size={16} />
            <span className="hidden sm:inline">Cast</span>
        </button>
    );
}
