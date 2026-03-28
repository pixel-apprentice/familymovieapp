import React, { useEffect, useState } from 'react';
import { PulseEvent } from '../../types/movie';
import { Star, CheckCircle, PlusCircle, RefreshCcw } from 'lucide-react';
import { CouchAlert } from './CouchAlert';

interface MovieProps {
  title: string;
  summary?: string;
  poster_url?: string;
  date?: string;
  genres?: string[];
  ratings?: Record<string, number>;
  pickedBy?: string;
  trailerKey?: string;
}

interface MoviePageTVProps {
  movie: MovieProps;
  activeTrailer?: string | null;
  pulseEvent?: PulseEvent | null;
}

// ─── TV_STYLES ────────────────────────────────────────────────────────────────
// Rules imposed by Chromecast CAF renderer:
//   ✓ flexbox, fixed px, absolute positioning, percentages
//   ✗ vh/vw, calc(), sticky, grid, Tailwind responsive prefixes
const TV_STYLES: Record<string, React.CSSProperties> = {
  // Full-screen outer wrapper
  // 100% + min-height in fixed px avoids Android TV system bar miscalculating vh units
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    minHeight: '720px',
    backgroundColor: '#09090b',
    color: '#fafafa',
    fontFamily: '"Outfit", "Inter", sans-serif',
    padding: '48px 64px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    zIndex: 1,
  },

  // Backdrop sits as a sibling OUTSIDE the overflow:hidden root, placed absolutely
  // via a wrapper div that covers the viewport
  backdropWrapper: {
    position: 'fixed',
    inset: '0',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backdropImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.15,
    filter: 'blur(40px)',         // 40px is the safe max for Onn 4K MediaTek GPU
    transform: 'scale(1.1)',     // slight scale to prevent blur-edge white fringe
  },

  // LEFT COLUMN — poster
  posterColumn: {
    width: '35%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: '64px',
  },
  posterWrapper: {
    width: '100%',
  },
  // 70vh replaced with a safe absolute pixel cap
  posterImg: {
    width: '100%',
    display: 'block',
    borderRadius: '24px',
    objectFit: 'contain',
    maxHeight: '560px',         // ← was '70vh' — violates the no-vh rule
    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  addedByBadge: {
    marginTop: '32px',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '20px',
    fontWeight: 800,
    textAlign: 'center',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    border: '1px solid rgba(56, 189, 248, 0.3)',
  },

  // RIGHT COLUMN — details
  detailsColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: '52px',
    fontWeight: 900,
    lineHeight: 1.05,
    color: '#ffffff',
    margin: '0 0 24px 0',
    letterSpacing: '-0.04em',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#a1a1aa',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '20px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap',
  },
  ratingPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '20px',
    fontWeight: 800,
    border: '1px solid rgba(251, 191, 36, 0.3)',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: '80px',
    height: '6px',
    backgroundColor: '#38bdf8',
    borderRadius: '3px',
    marginBottom: '40px',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
  },
  overview: {
    fontSize: '24px',
    lineHeight: 1.65,
    color: '#d4d4d8',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  // ── Trailer overlay (previously MISSING — caused broken trailer display) ──
  trailerOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    boxSizing: 'border-box',
  },
  trailerFrame: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '24px',
    boxShadow: '0 0 80px rgba(56, 189, 248, 0.3)',
  },
  trailerIndicator: {
    position: 'absolute',
    bottom: '56px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 32px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },

  alertIcon: {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  accentBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
    opacity: 0.3,
    zIndex: 10,
  },
};

export default function MoviePageTV({ movie, activeTrailer, pulseEvent }: MoviePageTVProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [movie.title]);

  const fadeStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
  };

  const getPosterSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://image.tmdb.org/t/p/w780${url}`;
  };

  const ratingValues = movie.ratings ? Object.values(movie.ratings).filter(v => v > 0) : [];
  const avgRating = ratingValues.length > 0
    ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
    : null;

  const showTrailer = activeTrailer && activeTrailer === movie.trailerKey;

  return (
    <>
      {/* Backdrop — lives OUTSIDE the overflow:hidden root so it isn't clipped */}
      {movie.poster_url && (
        <div style={TV_STYLES.backdropWrapper}>
          <img
            src={getPosterSrc(movie.poster_url)}
            alt=""
            style={TV_STYLES.backdropImg}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Trailer Overlay */}
      {showTrailer && (
        <div style={TV_STYLES.trailerOverlay}>
          <iframe
            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0`}
            style={TV_STYLES.trailerFrame}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Movie Trailer"
          />
          <div style={TV_STYLES.trailerIndicator}>
            Playing Trailer
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ ...TV_STYLES.root, ...fadeStyle }}>
        {/* LEFT: Poster */}
        <div style={TV_STYLES.posterColumn}>
          <div style={TV_STYLES.posterWrapper}>
            <img
              src={getPosterSrc(movie.poster_url)}
              alt={movie.title}
              style={TV_STYLES.posterImg}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          {movie.pickedBy && (
            <div style={TV_STYLES.addedByBadge}>
              Picked by {movie.pickedBy}
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div style={TV_STYLES.detailsColumn}>
          <h1 style={TV_STYLES.title}>{movie.title}</h1>

          <div style={TV_STYLES.metaRow}>
            {movie.date && (
              <span style={TV_STYLES.metaPill}>
                {movie.date.length > 4 ? movie.date.split('-')[0] : movie.date}
              </span>
            )}
            {movie.genres && movie.genres.length > 0 && (
              <span style={TV_STYLES.metaPill}>{movie.genres[0]}</span>
            )}
            {avgRating && (
              <span style={TV_STYLES.ratingPill}>★ {avgRating}</span>
            )}
          </div>

          <div style={TV_STYLES.divider} />

          <p style={TV_STYLES.overview}>{movie.summary}</p>
        </div>

        {/* TV Alert (Integrated Overlay) */}
        <CouchAlert event={pulseEvent || null} />
      </div>

      {/* Bottom accent bar */}
      <div style={TV_STYLES.accentBar} />
    </>
  );
}
