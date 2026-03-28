import React, { useEffect, useState } from 'react';
import { CheckCircle, PlusCircle, RefreshCcw } from 'lucide-react';
import { PulseEvent } from '../../types/movie';

const TV_STYLES: Record<string, React.CSSProperties> = {
  alertContainer: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    width: '80%',
    textAlign: 'center',
    zIndex: 300,
    pointerEvents: 'none',
    transition: 'opacity 0.6s ease-in-out, transform 0.6s ease-out',
  },
  pill: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(9, 9, 11, 0.82)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '20px 40px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
  },
  userName: {
    color: '#38bdf8',
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: '"Outfit", sans-serif',
    margin: 0,
  },
  mainText: {
    color: '#ffffff',
    fontSize: '30px',
    fontWeight: 900,
    fontFamily: '"Outfit", sans-serif',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  starRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
  },
  ratingNumber: {
    color: '#fbbf24',
    fontSize: '26px',
    fontWeight: 900,
    fontFamily: '"Outfit", sans-serif',
    marginLeft: '8px',
  },
  movieLabel: {
    color: '#a1a1aa',
    fontSize: '20px',
    fontWeight: 600,
    fontFamily: '"Outfit", sans-serif',
    margin: 0,
    letterSpacing: '0.02em',
  },
};

/** Renders up to 5 stars as filled / half-filled / empty SVG icons */
function StarBar({ value }: { value: number }) {
  return (
    <span style={TV_STYLES.starRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <svg key={i} width="28" height="28" viewBox="0 0 24 24" fill="none">
            {half ? (
              <>
                {/* half-filled: left side gold, right side dim */}
                <defs>
                  <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#3f3f46" />
                  </linearGradient>
                </defs>
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={`url(#half-${i})`}
                  stroke="#fbbf24"
                  strokeWidth="1"
                />
              </>
            ) : (
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={filled ? '#fbbf24' : '#3f3f46'}
                stroke={filled ? '#fbbf24' : '#52525b'}
                strokeWidth="1"
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}

export function CouchAlert({ event }: { event: PulseEvent | null }) {
  const [activeAlert, setActiveAlert] = useState<PulseEvent | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    if (event && (!activeAlert || event.timestamp !== activeAlert.timestamp)) {
      setActiveAlert(event);
      setAlertVisible(true);
      const timer = setTimeout(() => setAlertVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [event, activeAlert]);

  if (!activeAlert) return null;

  const numericRating = typeof activeAlert.value === 'number'
    ? activeAlert.value
    : parseFloat(String(activeAlert.value ?? '0'));

  return (
    <div style={{
      ...TV_STYLES.alertContainer,
      opacity: alertVisible ? 1 : 0,
      transform: `translateX(-50%) translateY(${alertVisible ? '0' : '20px'})`,
    }}>
      <div style={TV_STYLES.pill}>
        {/* User name header */}
        {activeAlert.userName && (
          <p style={TV_STYLES.userName}>{activeAlert.userName}</p>
        )}

        {/* Main action line */}
        {activeAlert.type === 'rating' && (
          <>
            <p style={TV_STYLES.mainText}>
              Rating: <StarBar value={numericRating} />
              <span style={TV_STYLES.ratingNumber}>{numericRating}</span>
            </p>
            {activeAlert.movieTitle && (
              <p style={TV_STYLES.movieLabel}>"{activeAlert.movieTitle}"</p>
            )}
          </>
        )}

        {activeAlert.type === 'watched' && (
          <p style={TV_STYLES.mainText}>
            <CheckCircle size={32} color="#10b981" />
            Just watched {activeAlert.movieTitle}!
          </p>
        )}

        {activeAlert.type === 'added' && (
          <p style={TV_STYLES.mainText}>
            <PlusCircle size={32} color="#3b82f6" />
            Added "{activeAlert.movieTitle}"
          </p>
        )}

        {activeAlert.type === 'status' && (
          <p style={TV_STYLES.mainText}>
            <RefreshCcw size={32} color="#38bdf8" />
            {activeAlert.message || activeAlert.title}
          </p>
        )}
      </div>
    </div>
  );
}
