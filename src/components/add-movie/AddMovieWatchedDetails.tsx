import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { hapticFeedback } from '../../utils/haptics';

interface Profile {
  id: string;
  name: string;
  color: string;
}

interface AddMovieWatchedDetailsProps {
  dateUnknown: boolean;
  setDateUnknown: (dateUnknown: boolean) => void;
  date: string;
  setDate: (date: string) => void;
  profiles: Profile[];
  ratings: Record<string, number>;
  handleRatingChange: (memberId: string, rating: number) => void;
}

export function AddMovieWatchedDetails({
  dateUnknown,
  setDateUnknown,
  date,
  setDate,
  profiles,
  ratings,
  handleRatingChange
}: AddMovieWatchedDetailsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-6 overflow-hidden px-6"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Date Watched</label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={dateUnknown}
              onChange={e => { hapticFeedback.light(); setDateUnknown(e.target.checked); }}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${dateUnknown ? 'bg-theme-primary border-theme-primary' : 'border-theme-border group-hover:border-theme-primary/50'}`}>
              {dateUnknown && <div className="w-1.5 h-1.5 bg-theme-base rounded-full" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-primary transition-colors">Date Unknown</span>
          </label>
        </div>
        {!dateUnknown && (
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-theme-base border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all font-mono"
            required
          />
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Rankings</label>
        <div className="space-y-2">
          {profiles.map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-theme-base rounded-xl border border-theme-border">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: profile.color }}>{profile.name}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(profile.id, star)}
                    className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all hover:scale-125 ${
                      star <= (ratings[profile.id] || 0) 
                        ? 'text-theme-primary' 
                        : 'text-theme-muted opacity-20'
                    }`}
                  >
                    <Star size={20} fill={star <= (ratings[profile.id] || 0) ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
