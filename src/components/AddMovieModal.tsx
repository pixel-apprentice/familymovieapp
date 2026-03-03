import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMovie } from '../services/tmdb';
import { useTheme } from '../contexts/ThemeContext';

import { AddMovieHeader } from './add-movie/AddMovieHeader';
import { AddMovieStatusSelector } from './add-movie/AddMovieStatusSelector';
import { AddMoviePickerSelector } from './add-movie/AddMoviePickerSelector';
import { AddMovieWatchedDetails } from './add-movie/AddMovieWatchedDetails';
import { AddMovieActions } from './add-movie/AddMovieActions';
import { useAddMovieForm } from './add-movie/useAddMovieForm';

interface AddMovieModalProps {
  movie: TMDBMovie | null;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMovieModal({ movie, onClose, onAdded }: AddMovieModalProps) {
  const { theme } = useTheme();
  
  const {
    status,
    setStatus,
    picker,
    setPicker,
    isFamilyPick,
    setIsFamilyPick,
    date,
    setDate,
    dateUnknown,
    setDateUnknown,
    ratings,
    handleRatingChange,
    isSubmitting,
    isSendingPlex,
    handlePlexRequest,
    handleSubmit,
    profiles
  } = useAddMovieForm(movie, onClose, onAdded);

  if (!movie) return null;

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
          <AddMovieHeader movie={movie} onClose={onClose} />

          <div className="py-4 overflow-y-auto custom-scrollbar flex-1">
            <form id="add-movie-form" onSubmit={handleSubmit} className="space-y-6">
              <AddMovieStatusSelector status={status} setStatus={setStatus} />
              
              <AddMoviePickerSelector 
                profiles={profiles} 
                picker={picker} 
                setPicker={setPicker} 
                isFamilyPick={isFamilyPick} 
                setIsFamilyPick={setIsFamilyPick} 
              />

              {status === 'watched' && (
                <AddMovieWatchedDetails 
                  dateUnknown={dateUnknown}
                  setDateUnknown={setDateUnknown}
                  date={date}
                  setDate={setDate}
                  profiles={profiles}
                  ratings={ratings}
                  handleRatingChange={handleRatingChange}
                />
              )}
            </form>
          </div>

          <AddMovieActions 
            isSendingPlex={isSendingPlex} 
            isSubmitting={isSubmitting} 
            handlePlexRequest={handlePlexRequest} 
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
