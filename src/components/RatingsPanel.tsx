import React from 'react';
import { useData } from '../contexts/DataContext';
import { StarIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { hapticFeedback } from '../utils/haptics';

export function RatingsPanel({ movieId, ratings }: { movieId: string, ratings: Record<string, number> }) {
  const { updateMovie, profiles } = useData();
  const { theme } = useTheme();
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(null);

  const handleRate = (memberId: string, rating: number) => {
    hapticFeedback.light();
    updateMovie(movieId, {
      ratings: {
        ...ratings,
        [memberId]: rating
      }
    });
    // Close popover after 300ms so they see the tap state
    setTimeout(() => setActiveProfileId(null), 300);
  };

  return (
    <div className={`mt-4 pt-4 border-t border-theme-border/30 flex flex-col gap-1.5 relative ${theme === 'vintage-ticket' ? 'bg-amber-50/50 p-4 rounded-lg shadow-inner' : ''}`}>
      {profiles.map(profile => {
        const rating = ratings[profile.id] || 0;
        const isActive = activeProfileId === profile.id;

        return (
          <div key={profile.id} className="relative flex items-center justify-between text-xs w-full">
            <span
              className="font-bold uppercase tracking-wider text-[9px] truncate max-w-[50%]"
              style={{ color: profile.color }}
              title={profile.name}
            >
              {profile.name}
            </span>

            <button
              onClick={(e) => {
                e.preventDefault();
                hapticFeedback.light();
                setActiveProfileId(isActive ? null : profile.id);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-theme-surface transition-colors"
            >
              <StarIcon
                filled={rating > 0}
                className="w-3.5 h-3.5"
                style={{ color: rating > 0 ? profile.color : undefined }}
              />
              <span className={`font-mono font-bold text-[10px] ${rating > 0 ? '' : 'text-theme-muted'}`}>
                {rating > 0 ? rating.toString() : '—'}
              </span>
            </button>

            {/* Popover for changing rating inline */}
            {isActive && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-50 bg-theme-surface border border-theme-border shadow-2xl rounded-xl p-2 flex gap-1 origin-right animate-in fade-in zoom-in duration-150"
              >
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRate(profile.id, star); }}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <StarIcon
                      filled={star <= rating}
                      className="w-4 h-4 transition-colors"
                      style={{ color: star <= rating ? profile.color : undefined }}
                    />
                  </button>
                ))}

                {/* Close button layered on the background so tapping outside doesn't automatically require a global listener for this simple popover */}
                <div className="fixed inset-0 -z-10" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProfileId(null); }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
