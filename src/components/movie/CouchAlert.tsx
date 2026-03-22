import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, PlusCircle, RefreshCcw } from 'lucide-react';
import { PulseEvent } from '../../types/movie';

const TV_STYLES: Record<string, React.CSSProperties> = {
  alertContainer: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    textAlign: 'center',
    zIndex: 300,
    pointerEvents: 'none',
    transition: 'opacity 0.6s ease-in-out, transform 0.6s ease-out',
  },
  alertText: {
    fontSize: '32px',
    fontWeight: 900,
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.4)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    fontFamily: '"Outfit", sans-serif',
  },
  alertUser: {
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '24px',
    marginBottom: '8px',
    display: 'block',
    fontWeight: 900,
  },
  alertIcon: {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
};

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

  return (
    <div style={{ 
      ...TV_STYLES.alertContainer, 
      opacity: alertVisible ? 1 : 0,
      transform: `translateX(-50%) translateY(${alertVisible ? '0' : '20px'})`
    }}>
      {activeAlert.userName && (
        <span style={TV_STYLES.alertUser}>{activeAlert.userName}</span>
      )}
      <p style={TV_STYLES.alertText}>
        <span style={TV_STYLES.alertIcon}>
          {activeAlert.type === 'rating' && <Star size={36} fill="#fbbf24" color="#fbbf24" />}
          {activeAlert.type === 'watched' && <CheckCircle size={36} color="#10b981" />}
          {activeAlert.type === 'added' && <PlusCircle size={36} color="#3b82f6" />}
          {activeAlert.type === 'status' && <RefreshCcw size={36} color="#38bdf8" />}
        </span>
        {activeAlert.type === 'rating' && `Rated ${activeAlert.movieTitle} — ${activeAlert.value} stars`}
        {activeAlert.type === 'watched' && `Just watched ${activeAlert.movieTitle}!`}
        {activeAlert.type === 'added' && `Added ${activeAlert.movieTitle} to the list`}
        {activeAlert.type === 'status' && (activeAlert.message || activeAlert.title)}
      </p>
    </div>
  );
}
