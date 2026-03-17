import React, { useEffect, useState } from 'react';

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
}

const TV_STYLES: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    minHeight: '100%',
    position: 'relative',
    backgroundColor: '#09090b',
    color: '#fafafa',
    fontFamily: '"Outfit", "Inter", sans-serif',
    padding: '48px 64px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    zIndex: 1000,
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
    position: 'relative',
  },
  posterImg: {
    width: '100%',
    display: 'block',
    borderRadius: '24px',
    objectFit: 'contain',
    maxHeight: '70vh',
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
    width: 'fit-content',
  },

  // RIGHT COLUMN — details
  detailsColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: '8px',
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
  },
  ratingPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '20px',
    fontWeight: 800,
    border: '1px solid rgba(251, 191, 36, 0.3)',
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
    fontSize: '26px',
    lineHeight: 1.6,
    color: '#d4d4d8',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    maxWidth: '90%',
  },

  // Backdrop glow
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: -1,
    opacity: 0.4,
    filter: 'blur(100px)',
    transform: 'scale(1.1)',
  },
  accentBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #38bdf8 50%, transparent)',
    opacity: 0.3,
  },
};

export default function MoviePageTV({ movie, activeTrailer }: MoviePageTVProps) {
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

  // Calculate average rating
  const ratingValues = movie.ratings ? Object.values(movie.ratings).filter(v => v > 0) : [];
  const avgRating = ratingValues.length > 0 
    ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
    : null;

  const showTrailer = activeTrailer && activeTrailer === movie.trailerKey;

  return (
    <div style={{ ...TV_STYLES.root, ...fadeStyle }}>
      {/* Dynamic Backdrop */}
      {movie.poster_url && (
        <img
          src={getPosterSrc(movie.poster_url)}
          style={TV_STYLES.backdrop}
          aria-hidden="true"
        />
      )}

      {/* Trailer Overlay */}
      {showTrailer && (
        <div style={TV_STYLES.trailerOverlay}>
          <iframe
            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0`}
            style={TV_STYLES.trailerFrame}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <div style={TV_STYLES.trailerIndicator} className="animate-pulse">
            Playing Trailer
          </div>
        </div>
      )}

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

      {/* Bottom accent */}
      <div style={TV_STYLES.accentBar} />
    </div>
  );
}
