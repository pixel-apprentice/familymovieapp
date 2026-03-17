import React from 'react';
import { Movie, FamilyProfile } from '../../contexts/DataContext';
import { Star } from 'lucide-react';
import { hapticFeedback } from '../../utils/haptics';

interface MovieDetailRankingsProps {
  movie: Movie;
  profiles: FamilyProfile[];
  handleRatingToggle: (profileId: string, star: number) => Promise<void>;
}

export function MovieDetailRankings({ movie, profiles, handleRatingToggle }: MovieDetailRankingsProps) {
  return (
    <section className="bg-theme-surface/30 border border-theme-border rounded-3xl p-4 md:p-8 space-y-4 mt-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-theme-primary">
          <Star size={16} />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Family Rankings</h2>
        </div>
        <div className="text-[10px] font-mono text-theme-muted uppercase">Tap star again to toggle half</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-theme-base/40 backdrop-blur-md border border-theme-border/50 rounded-3xl px-6 py-5 flex items-center justify-between flex-row group/rank transition-all">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest truncate profile-name" style={{ color: profile.color }}>
              {profile.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center -space-x-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const currentRating = movie.ratings[profile.id] || 0;
                  const isFull = s <= currentRating;
                  const isHalf = s - 0.5 === currentRating;
                  
                  return (
                    <div key={s} className="relative flex items-center select-none h-10 w-7">
                      <button 
                        onClick={() => {
                          hapticFeedback.light();
                          handleRatingToggle(profile.id, s);
                        }} 
                        className="absolute inset-0 z-20 cursor-pointer" 
                      />
                      <Star 
                        size={24} 
                        className={`transition-all ${isFull || isHalf ? 'text-amber-400' : 'text-theme-muted opacity-10'}`} 
                        fill={isFull ? 'currentColor' : isHalf ? 'url(#halfStarDetail)' : 'none'} 
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-mono font-black text-theme-text w-6 text-right tabular-nums shrink-0">
                {movie.ratings[profile.id] > 0 ? movie.ratings[profile.id] : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
