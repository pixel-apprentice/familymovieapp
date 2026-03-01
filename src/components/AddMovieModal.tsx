import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMovie, GENRE_MAP } from '../services/tmdb';
import { useData, FamilyMember, TURN_ORDER, FAMILY_COLORS } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Star } from 'lucide-react';

interface AddMovieModalProps {
  movie: TMDBMovie | null;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMovieModal({ movie, onClose, onAdded }: AddMovieModalProps) {
  const { addMovie, currentTurnIndex } = useData();
  const { theme } = useTheme();
  
  const [status, setStatus] = useState<'wishlist' | 'watched'>('wishlist');
  const [picker, setPicker] = useState<FamilyMember>(TURN_ORDER[currentTurnIndex]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ratings, setRatings] = useState<Record<FamilyMember, number>>({
    Jack: 0,
    Simone: 0,
    Mom: 0,
    Dad: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!movie) return null;

  const handleRatingChange = (member: FamilyMember, rating: number) => {
    setRatings(prev => ({ ...prev, [member]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addMovie({
        title: movie.title,
        poster_url: movie.poster_path || undefined,
        status,
        pickedBy: picker,
        genres: movie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean),
        ratings: status === 'watched' ? ratings : { Jack: 0, Simone: 0, Mom: 0, Dad: 0 },
        date: status === 'watched' ? date : undefined,
      });
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-theme-base/80 backdrop-blur-xl overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`w-full max-w-lg bg-theme-surface rounded-[2rem] border-2 border-theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
          } ${
            theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
          }`}
        >
          <div className="p-6 border-b border-theme-border flex items-center justify-between shrink-0">
            <h2 className="text-xl font-black uppercase tracking-widest text-theme-primary">Add Movie</h2>
            <button onClick={onClose} className="text-theme-muted hover:text-theme-text font-black uppercase text-xs tracking-widest">Close</button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex gap-4 mb-8">
              {movie.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-24 h-36 object-cover rounded-xl shadow-lg" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-24 h-36 bg-theme-base rounded-xl flex items-center justify-center border border-theme-border">
                  <span className="text-[10px] text-theme-muted uppercase font-black text-center px-2">No Poster</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-black leading-tight mb-2 text-theme-text">{movie.title}</h3>
                <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">{movie.release_date?.split('-')[0]}</p>
              </div>
            </div>

            <form id="add-movie-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Status Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">List</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('wishlist')}
                    className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-2 ${
                      status === 'wishlist' 
                        ? 'bg-theme-primary text-theme-base border-theme-primary' 
                        : 'bg-theme-base text-theme-text border-theme-border hover:border-theme-primary/50'
                    }`}
                  >
                    Watchlist
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('watched')}
                    className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-2 ${
                      status === 'watched' 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-theme-base text-theme-text border-theme-border hover:border-emerald-500/50'
                    }`}
                  >
                    Watched
                  </button>
                </div>
              </div>

              {/* Picker Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Who picked it?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TURN_ORDER.map(member => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => setPicker(member)}
                      className={`py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${
                        picker === member 
                          ? 'border-transparent text-white' 
                          : 'bg-theme-base text-theme-text border-theme-border hover:border-theme-primary/50'
                      }`}
                      style={picker === member ? { backgroundColor: FAMILY_COLORS[member] } : {}}
                    >
                      {picker === member && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watched Details */}
              {status === 'watched' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Date Watched</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-theme-base border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Rankings</label>
                    <div className="space-y-2">
                      {TURN_ORDER.map(member => (
                        <div key={member} className="flex items-center justify-between p-3 bg-theme-base rounded-xl border border-theme-border">
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: FAMILY_COLORS[member] }}>{member}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingChange(member, star)}
                                className={`p-1 transition-all hover:scale-125 ${
                                  star <= ratings[member] 
                                    ? 'text-theme-primary' 
                                    : 'text-theme-muted opacity-20'
                                }`}
                              >
                                <Star size={16} fill={star <= ratings[member] ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          <div className="p-6 border-t border-theme-border bg-theme-base/50 shrink-0">
            <button 
              type="submit"
              form="add-movie-form"
              disabled={isSubmitting}
              className="w-full py-4 bg-theme-primary text-theme-base font-black rounded-xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            >
              {isSubmitting ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
