import React from 'react';
import { useData, FamilyMember, TURN_ORDER, FAMILY_COLORS } from '../contexts/DataContext';
import { StarIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';

export function RatingsPanel({ movieId, ratings }: { movieId: string, ratings: Record<FamilyMember, number> }) {
  const { updateMovie } = useData();
  const { theme } = useTheme();

  const handleRate = (member: FamilyMember, rating: number) => {
    updateMovie(movieId, {
      ratings: {
        ...ratings,
        [member]: rating
      }
    });
  };

  return (
    <div className={`mt-4 pt-4 border-t border-theme-border/30 flex flex-col gap-2 ${theme === 'vintage-ticket' ? 'bg-amber-50/50 p-4 rounded-lg shadow-inner' : ''}`}>
      {TURN_ORDER.map(member => (
        <div key={member} className="flex items-center justify-between text-sm">
          <span className="font-bold w-16 text-right mr-4 uppercase tracking-wider text-[10px]" style={{ color: FAMILY_COLORS[member] }}>{member}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                filled={star <= (ratings[member] || 0)}
                onClick={() => handleRate(member, star)}
                className="w-5 h-5 transition-colors"
                style={{ color: star <= (ratings[member] || 0) ? FAMILY_COLORS[member] : undefined }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
