import React from 'react';
import { Tv } from 'lucide-react';
import { useCast } from '../hooks/useCast';

export function CastButton() {
  const { isCasting, toggleCast } = useCast();

  return (
    <button
      onClick={toggleCast}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation text-[10px] font-black uppercase tracking-widest ${
        isCasting
          ? 'bg-theme-primary text-theme-base shadow-lg animate-pulse'
          : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
      }`}
      title={isCasting ? 'Click to stop casting' : 'Connect to TV'}
    >
      <Tv size={16} />
      <span className="hidden sm:inline">{isCasting ? 'Disconnect TV' : 'Connect TV'}</span>
    </button>
  );
}
