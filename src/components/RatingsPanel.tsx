import React from 'react';
import { useData } from '../contexts/DataContext';
import { StarIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { hapticFeedback } from '../utils/haptics';

export function RatingsPanel({ movieId, ratings }: { movieId: string, ratings: Record<string, number> }) {
  const { updateMovie, profiles } = useData();
  const { theme } = useTheme();

  const handleRate = (memberId: string, rating: number) => {
    hapticFeedback.light();
    updateMovie(movieId, {
      ratings: {
        ...ratings,
        [memberId]: rating
      }
    });
  };

  return (
    <div className={`mt-4 pt-4 border-t border-theme-border/30 flex flex-col gap-1.5 ${theme === 'vintage-ticket' ? 'bg-amber-50/50 p-4 rounded-lg shadow-inner' : ''}`}>
      {profiles.map(profile => (
        <div key={profile.id} className="flex items-center justify-between text-xs">
          <span className="font-bold w-14 text-right mr-3 uppercase tracking-wider text-[9px] truncate" style={{ color: profile.color }} title={profile.name}>{profile.name}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={(e) => { e.preventDefault(); handleRate(profile.id, star); }}
                className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center transition-transform hover:scale-125 focus:outline-none"
              >
                <StarIcon
                  filled={star <= (ratings[profile.id] || 0)}
                  className="w-3.5 h-3.5 transition-colors"
                  style={{ color: star <= (ratings[profile.id] || 0) ? profile.color : undefined }}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
