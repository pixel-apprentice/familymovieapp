import React, { useState } from 'react';
import { TMDBMovie, GENRE_MAP } from '../../services/tmdb';
import { useData } from '../../contexts/DataContext';
import { sendRequestEmail } from '../../services/emailService';
import { toast } from 'sonner';
import { hapticFeedback } from '../../utils/haptics';

export function useAddMovieForm(movie: TMDBMovie | null, onClose: () => void, onAdded: () => void) {
  const { addMovie, currentTurnIndex, movies, profiles } = useData();
  
  const [status, setStatus] = useState<'wishlist' | 'watched'>('wishlist');
  const [picker, setPicker] = useState<string>(profiles[currentTurnIndex]?.id || '');
  const [isFamilyPick, setIsFamilyPick] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingPlex, setIsSendingPlex] = useState(false);

  const handlePlexRequest = async () => {
    if (!movie) return;
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

  const handleRatingChange = (memberId: string, rating: number) => {
    hapticFeedback.light();
    setRatings(prev => ({ ...prev, [memberId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;
    
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

  return {
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
  };
}
