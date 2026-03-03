import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMovie, GENRE_MAP } from '../services/tmdb';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { Star, Mail, X } from 'lucide-react';
import { sendRequestEmail } from '../services/emailService';
import { toast } from 'sonner';
import { hapticFeedback } from '../utils/haptics';

interface AddMovieModalProps {
  movie: TMDBMovie | null;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMovieModal({ movie, onClose, onAdded }: AddMovieModalProps) {
  const { addMovie, currentTurnIndex, movies, profiles } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
  
  const [status, setStatus] = useState<'wishlist' | 'watched'>('wishlist');
  const [picker, setPicker] = useState<string>(profiles[currentTurnIndex]?.id || '');
  const [isFamilyPick, setIsFamilyPick] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingPlex, setIsSendingPlex] = useState(false);

  const handlePlexRequest = async () => {
    setIsSendingPlex(true);
    hapticFeedback.light();
    const success = await sendRequestEmail(
      'movie', 
      movie.title, 
      'Plex request from Family Movie App'
    );
    setIsSendingPlex(false);

    if (success) {
      hapticFeedback.success();
      toast.success(`Dad has been asked to add "${movie.title}" to Plex. 🍿`);
    } else {
      hapticFeedback.error();
      toast.error('Failed to send the request. Maybe tell him in person?');
    }
  };

  if (!movie) return null;

  const handleRatingChange = (memberId: string, rating: number) => {
    hapticFeedback.light();
    setRatings(prev => ({ ...prev, [memberId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input Sanitization: Check for future dates
    if (status === 'watched' && !dateUnknown) {
      const selectedDate = new Date(date);
      const today = new Date();
      if (selectedDate > today) {
        hapticFeedback.error();
        toast.error("You can't watch a movie in the future!");
        return;
      }
    }

    // Input Sanitization: Check for duplicates
    const isDuplicate = movies.some(m => m.id.toString() === movie.id.toString() || m.tmdbId?.toString() === movie.id.toString());
    if (isDuplicate) {
      hapticFeedback.error();
      toast.error(`"${movie.title}" is already in your list!`);
      return;
    }

    setIsSubmitting(true);
    hapticFeedback.medium();
    
    try {
      await addMovie({
        id: movie.id.toString(), // Ensure we save the TMDB ID
        tmdbId: movie.id.toString(),
        title: movie.title,
        poster_url: movie.poster_path || undefined,
        status,
        pickedBy: isFamilyPick ? 'Family' : picker,
        genres: movie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean),
        ratings: status === 'watched' ? ratings : {},
        date: status === 'watched' ? (dateUnknown ? 'Unknown' : date) : undefined,
      });
      hapticFeedback.success();
      toast.success(`Added "${movie.title}" to ${status === 'watched' ? 'History' : 'Watchlist'}`);
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add movie:', error);
      hapticFeedback.error();
      toast.error('Failed to add movie. Please try again.');
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
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-theme-base/80 backdrop-blur-xl overflow-hidden"
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`w-full max-w-lg bg-theme-surface rounded-t-[2rem] sm:rounded-[2rem] border-t-2 sm:border-2 border-theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            theme === 'modern-pinnacle' ? 'sm:rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
          } ${
            theme === 'modern-luminous' ? 'sm:rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
          }`}
        >
          {/* Mobile drag handle */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-theme-border rounded-full" />
          </div>

          <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-theme-border flex items-center justify-between shrink-0">
            <h2 className="text-xl font-black uppercase tracking-widest text-theme-primary">Add Movie</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-theme-muted hover:text-theme-text transition-colors">
              <X size={24} />
            </button>
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

              {/* Picker Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Who picked it?</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={isFamilyPick}
                      onChange={e => { hapticFeedback.light(); setIsFamilyPick(e.target.checked); }}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${isFamilyPick ? 'bg-theme-primary border-theme-primary' : 'border-theme-border group-hover:border-theme-primary/50'}`}>
                      {isFamilyPick && <div className="w-1.5 h-1.5 bg-theme-base rounded-full" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-primary transition-colors">Family Pick</span>
                  </label>
                </div>
                <div className={`grid grid-cols-2 gap-2 transition-opacity ${isFamilyPick ? 'opacity-30 pointer-events-none' : ''}`}>
                  {profiles.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => { hapticFeedback.light(); setPicker(profile.id); }}
                      className={`min-h-[44px] py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${
                        picker === profile.id 
                          ? 'border-transparent text-white' 
                          : 'bg-theme-base text-theme-text border-theme-border hover:border-theme-primary/50'
                      }`}
                      style={picker === profile.id ? { backgroundColor: profile.color } : {}}
                    >
                      {picker === profile.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      {profile.name}
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
              )}
            </form>
          </div>

          <div className="p-6 border-t border-theme-border bg-theme-base/50 shrink-0 space-y-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handlePlexRequest}
              disabled={isSendingPlex}
              className="w-full min-h-[44px] py-3 bg-indigo-600/10 text-indigo-500 border-2 border-indigo-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mail size={14} />
              {isSendingPlex ? 'Sending...' : 'Ask Dad to add to Plex'}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              type="submit"
              form="add-movie-form"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-4 bg-theme-primary text-theme-base font-black rounded-xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            >
              {isSubmitting ? 'Adding...' : 'Add Movie'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
