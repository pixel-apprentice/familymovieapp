import React from 'react';
import { hapticFeedback } from '../../utils/haptics';

interface AddMovieStatusSelectorProps {
  status: 'wishlist' | 'watched';
  setStatus: (status: 'wishlist' | 'watched') => void;
}

export function AddMovieStatusSelector({ status, setStatus }: AddMovieStatusSelectorProps) {
  return (
    <div className="space-y-3 px-6">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">List</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setStatus('wishlist'); }}
          className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-2 ${
            status === 'wishlist' 
              ? 'bg-theme-primary text-theme-base border-theme-primary' 
              : 'bg-theme-base text-theme-text border-theme-border hover:border-theme-primary/50'
          }`}
        >
          Watchlist
        </button>
        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setStatus('watched'); }}
          className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-2 ${
            status === 'watched' 
              ? 'bg-emerald-500 text-white border-emerald-500' 
              : 'bg-theme-base text-theme-text border-theme-border hover:border-emerald-500/50'
          }`}
        >
          Watched
        </button>
      </div>
    </div>
  );
}
