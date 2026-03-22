import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData, Movie } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Edit2, RefreshCw, Sparkles } from 'lucide-react';
import { movieService } from '../services/movieService';
import { handleError } from '../utils/errorHandler';
import { toast } from 'sonner';
import { MovieEditForm } from '../components/movie/MovieEditForm';
import { MovieActions } from '../components/movie/MovieActions';
import { hapticFeedback } from '../utils/haptics';
import { getWatchPartyIdeas } from '../services/gemini';
import { isCouchModeEnabled } from '../utils/isCouchMode';
import { logger } from '../utils/logger';
import MoviePageTV from '../components/movie/MoviePageTV';
import { useMovieFilters } from '../hooks/useMovieFilters';
import { MovieDetailHeader } from '../components/movie/MovieDetailHeader';
import { MovieDetailRankings } from '../components/movie/MovieDetailRankings';
import { MovieDetailPartyPack } from '../components/movie/MovieDetailPartyPack';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { movies, updateMovie, markWatched, removeMovie, profiles, pushCouchState, couchState, pushPulseEvent } = useData();
  const { showModal } = useModal();

  const isCouchMode = isCouchModeEnabled();
  const movie = movies.find(m => m.id === id);

  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [watchPartyPack, setWatchPartyPack] = useState<{ snack: string; activity: string; prompt: string } | null>(null);
  const [editForm, setEditForm] = useState({ date: '', status: 'wishlist' as const, pickedBy: '' });

  // Navigation Logic
  const { filteredWishlist, filteredWatched } = useMovieFilters();
  const isWishlist = movie?.status === 'wishlist';
  const activeList = isWishlist ? filteredWishlist : filteredWatched;
  const currentIdx = movie ? activeList.findIndex(m => m.id === movie.id) : -1;
  const prevMovie = currentIdx > 0 ? activeList[currentIdx - 1] : null;
  const nextMovie = currentIdx !== -1 && currentIdx < activeList.length - 1 ? activeList[currentIdx + 1] : null;

  useEffect(() => {
    if (movie && (!isEditing || editForm.pickedBy === '')) {
      setEditForm({
        date: movie.date || '',
        status: movie.status || 'wishlist',
        pickedBy: movie.pickedBy || ''
      });
    }
  }, [movie, isEditing]);

  useEffect(() => {
    if (id && !isCouchMode) {
      window.scrollTo(0, 0);
      pushCouchState({ path: `/movie/${id}`, movieId: id });
    }
  }, [id, pushCouchState, isCouchMode]);

  const handleRefreshMetadata = async () => {
    if (!movie || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const metadata = await movieService.fetchMetadata(movie.title, movie.tmdbId);
      if (metadata) {
        await updateMovie(movie.id, metadata);
      } else {
        toast.error(`No metadata found for "${movie.title}"`);
      }
    } catch (error) {
      handleError(error, "Failed to refresh metadata");
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateWatchPartyPack = async () => {
    if (!movie) return;
    setIsGeneratingPack(true);
    try {
      const pack = await getWatchPartyIdeas(movie.title, movie.genres, movie.summary);
      setWatchPartyPack(pack);
      hapticFeedback.success();
    } catch (err) {
      handleError(err, "Failed to generate party ideas");
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const handleRatingToggle = async (profileId: string, star: number) => {
    const currentRating = movie?.ratings[profileId] || 0;
    const newRating = movieService.calculateNewRating(currentRating, star);

    try {
      const newRatings = { ...movie!.ratings, [profileId]: newRating };
      await updateMovie(movie!.id, { ratings: newRatings });
      
      const profile = profiles.find(p => p.id === profileId);
      if (profile && newRating > 0) {
        await pushPulseEvent({
          type: 'rating',
          userName: profile.name,
          movieTitle: movie!.title,
          value: newRating
        });
      }
      if (newRating % 1 !== 0) hapticFeedback.light();
      else hapticFeedback.medium();
    } catch (error) {
      handleError(error, "Failed to update rating");
    }
  };

  const handleSave = async () => {
    if (!movie) return;
    try {
      await updateMovie(movie.id, editForm);
      setIsEditing(false);
      toast.success('Movie details updated successfully!');
    } catch (error) {
      handleError(error, "Failed to save changes");
    }
  };

  const handleDelete = async () => {
    if (!movie) return;
    const confirmed = await showModal({
      type: 'confirm',
      title: 'Delete Movie',
      message: 'Are you sure you want to delete this movie?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      await removeMovie(movie.id);
      navigate('/');
    }
  };

  const handlePlexRequest = async () => {
    if (!movie) return;
    setIsSending(true);
    try {
      await movieService.requestPlex(movie.title);
      showModal({
        type: 'alert',
        title: 'Request Sent!',
        message: `Dad has been asked to add "${movie.title}" to Plex. 🍿`,
        confirmText: 'Awesome'
      });
    } catch (error) {
      handleError(error, "Failed to send Plex request");
    } finally {
      setIsSending(false);
    }
  };

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-black uppercase tracking-widest text-theme-muted">Movie not found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-theme-primary text-theme-base font-black rounded-xl uppercase text-xs tracking-widest">Go Back Home</button>
      </div>
    );
  }

  const trailerUrl = movie.trailerKey
    ? `https://www.youtube.com/watch?v=${movie.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;

  if (isCouchMode) {
    return <MoviePageTV movie={movie} activeTrailer={couchState?.activeTrailer} pulseEvent={useData().pulseEvent} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 md:py-4">
      <AnimatePresence>
        {isCouchMode && couchState?.activeTrailer === movie.trailerKey && (
          <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-[5vw]">
            <iframe src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0`} className="w-full h-full rounded-3xl shadow-2xl border-4 border-white/10" allow="autoplay; encrypted-media" allowFullScreen />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/20 text-white/60 text-sm font-black uppercase tracking-widest animate-pulse">Playing Trailer on TV</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        {currentIdx !== -1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => prevMovie && navigate(`/movie/${prevMovie.id}`)} disabled={!prevMovie} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-theme-border hover:border-theme-primary hover:text-theme-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation">
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="text-[10px] text-theme-muted font-mono">{currentIdx + 1} / {activeList.length}</span>
            <button onClick={() => nextMovie && navigate(`/movie/${nextMovie.id}`)} disabled={!nextMovie} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-theme-border hover:border-theme-primary hover:text-theme-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation">
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      <MovieDetailHeader
        movie={movie}
        isEditing={isEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        profiles={profiles}
        handleSave={handleSave}
        setIsEditing={setIsEditing}
        handleRefreshMetadata={handleRefreshMetadata}
        isRefreshing={isRefreshing}
        generateWatchPartyPack={generateWatchPartyPack}
        isGeneratingPack={isGeneratingPack}
        Sparkles={Sparkles}
      />

      <MovieDetailRankings
        movie={movie}
        profiles={profiles}
        handleRatingToggle={handleRatingToggle}
      />

      <MovieDetailPartyPack
        pack={watchPartyPack}
        isVisible={!!watchPartyPack}
        onClose={() => setWatchPartyPack(null)}
      />

      <div className="pt-2">
        <MovieActions movie={movie} trailerUrl={trailerUrl} isSending={isSending} handlePlexRequest={handlePlexRequest} markWatched={markWatched} handleDelete={handleDelete} couchState={couchState} pushCouchState={pushCouchState} />
      </div>
    </div>
  );
}
