import React, { useEffect, useRef, useState } from 'react';
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
  const isInitializedRef = useRef(false);
  const lastFallbackMediaKeyRef = useRef<string | null>(null);

  const hasCustomReceiver = !!import.meta.env.VITE_CAST_APP_ID;

  useEffect(() => {
    const onSessionStateChanged = (event: any) => {
      const state = event?.sessionState;
      const casting = state === 'SESSION_STARTED' || state === 'SESSION_RESUMED';

      if (casting) {
        setIsCasting(true);
        pushCouchState({ path: window.location.pathname, timestamp: Date.now() });
      } else if (state === 'SESSION_ENDED') {
        setIsCasting(false);
        lastFallbackMediaKeyRef.current = null;
      }
    };

    const initializeCast = (isAvailable: boolean) => {
      if (!isAvailable || isInitializedRef.current) return;

      setCastAvailable(true);
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      if (!castContext) return;

      const appId = import.meta.env.VITE_CAST_APP_ID || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      const sessionRequest = new window.chrome.cast.SessionRequest(appId);
      sessionRequest.capabilities = [window.chrome.cast.Capability.VIDEO_OUT];

      castContext.setOptions({
        receiverApplicationId: appId,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGINAL_SCOPE,
        sessionRequest,
      });

      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChanged
      );

      isInitializedRef.current = true;
      setIsCasting(Boolean(castContext.getCurrentSession()));
    };

    window.__onGCastApiAvailable = initializeCast;

    if (typeof window !== 'undefined' && window.chrome?.cast?.isAvailable) {
      initializeCast(true);
    }

    return () => {
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      if (castContext && isInitializedRef.current) {
        castContext.removeEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          onSessionStateChanged
        );
      }
      isInitializedRef.current = false;
    };
  }, [pushCouchState]);

  // Fallback: If no custom receiver is set, stream posters manually via Default Media Receiver.
  useEffect(() => {
    if (!isCasting || hasCustomReceiver) return;

    const session = window.cast?.framework?.CastContext?.getInstance?.()?.getCurrentSession?.();
    if (!session) return;

    const movieId = location.pathname.split('/movie/')[1];
    let mediaInfo: any = null;
    let mediaKey = location.pathname;

    if (movieId) {
      const movie = movies.find(m => m.id === movieId);
      if (movie && movie.poster_url) {
        const imgUrl = movie.poster_url.startsWith('http') ? movie.poster_url : `https://image.tmdb.org/t/p/w500${movie.poster_url}`;

        const ratings = Object.entries(movie.ratings || {})
          .filter(([_, r]) => typeof r === 'number' && r > 0)
          .map(([id, r]) => `${id.charAt(0)}: ${r}★`)
          .join(', ');

        const statusText = movie.status === 'watched' ? 'Watched' : 'Wishlist';
        const pickedByText = movie.pickedBy || 'Family';
        const subtitle = `${statusText} • Picked by ${pickedByText}${ratings ? ` • ${ratings}` : ''}`;

        mediaInfo = new window.chrome.cast.media.MediaInfo(imgUrl, 'image/jpeg');
        mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
        mediaInfo.metadata.title = movie.title;
        mediaInfo.metadata.subtitle = subtitle;
        mediaInfo.metadata.images = [{ url: imgUrl }];
        mediaKey = `${movie.id}:${imgUrl}:${subtitle}`;
      }
    } else {
      const pwaIcon = `${window.location.origin}/pwa-512.png`;
      mediaInfo = new window.chrome.cast.media.MediaInfo(pwaIcon, 'image/png');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
      mediaInfo.metadata.title = 'Family Movie Night';
      mediaInfo.metadata.images = [{ url: pwaIcon }];
      mediaKey = `home:${pwaIcon}`;
    }

    if (!mediaInfo || lastFallbackMediaKeyRef.current === mediaKey) return;

    const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
    session.loadMedia(request)
      .then(() => {
        lastFallbackMediaKeyRef.current = mediaKey;
      })
      .catch((err: any) => console.log('Cast media load fallback errored:', err));
  }, [isCasting, location.pathname, movies, hasCustomReceiver]);

  const handleCastClick = async () => {
    hapticFeedback.medium();
    try {
      const castContext = window.cast?.framework?.CastContext?.getInstance?.();
      await castContext?.requestSession?.();
    } catch (error) {
      console.log('Cast session request failed:', error);
    }
  };

  if (!castAvailable) return null;

  return (
    <button
      onClick={handleCastClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation text-[10px] font-black uppercase tracking-widest ${isCasting
        ? 'bg-theme-primary text-theme-base shadow-lg animate-pulse'
        : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
        }`}
      title={isCasting ? 'Casting to TV...' : 'Cast to TV'}
    >
      <Tv size={16} />
      <span className="hidden sm:inline">Cast</span>
    </button>
  );
}
