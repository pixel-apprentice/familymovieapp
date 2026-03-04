import React, { useState, useEffect } from 'react';
import { TMDBMovie } from '../../services/tmdb';
import { useData } from '../../contexts/DataContext';
import { sendRequestEmail } from '../../services/emailService';
import { toast } from 'sonner';

export function useAddMovieForm(movie: TMDBMovie | null, onClose: () => void, onAdded: () => void) {
  const { addMovie, profiles, currentTurnIndex } = useData();
  const [status, setStatus] = useState<'wishlist' | 'watched'>('wishlist');
  const [picker, setPicker] = useState<string>('');
  const [isFamilyPick, setIsFamilyPick] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingPlex, setIsSendingPlex] = useState(false);

  useEffect(() => {
    if (profiles.length > 0 && !picker) {
      setPicker(profiles[currentTurnIndex]?.id || profiles[0].id);
    }
  }, [profiles, currentTurnIndex, picker]);

  const handleRatingChange = (profileId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [profileId]: rating }));
  };

  const handlePlexRequest = async () => {
    if (!movie) return;
    setIsSendingPlex(true);
    try {
      const success = await sendRequestEmail(
        'movie',
        movie.title,
        'Plex request from Family Movie App'
      );
      if (success) {
        toast.success(`Plex request sent for "${movie.title}"!`);
      }
    } catch (error) {
      toast.error('Failed to send Plex request');
    } finally {
      setIsSendingPlex(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;

    setIsSubmitting(true);
    try {
      const finalPicker = isFamilyPick ? 'Family' : picker;
      const finalDate = dateUnknown ? 'Unknown' : date;

      await addMovie({
        tmdbId: movie.id.toString(),
        title: movie.title,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        trailerKey: movie.trailerKey,
        summary: movie.overview,
        status,
        pickedBy: finalPicker,
        date: status === 'watched' ? finalDate : undefined,
        ratings: status === 'watched' ? ratings : {}
      });

      toast.success(`Added ${movie.title}`);
      onAdded();
      onClose();
    } catch (error) {
      toast.error('Failed to add movie');
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
