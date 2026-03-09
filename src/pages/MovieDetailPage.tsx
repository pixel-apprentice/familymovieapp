import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Movie } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Info, Edit2, RefreshCw } from 'lucide-react';
import { sendRequestEmail } from '../services/emailService';
import { searchMovies, getMovieDetails, pickBestMovieMatch, GENRE_MAP } from '../services/tmdb';
import { handleError } from '../utils/errorHandler';
import { toast } from 'sonner';
import { MovieEditForm } from '../components/movie/MovieEditForm';
import { MovieActions } from '../components/movie/MovieActions';
import { hapticFeedback } from '../utils/haptics';
import { getWatchPartyIdeas } from '../services/gemini';
import { Sparkles } from 'lucide-react';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { movies, updateMovie, markWatched, removeMovie, profiles } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [watchPartyPack, setWatchPartyPack] = useState<{ snack: string; activity: string; prompt: string } | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    status: 'wishlist' as 'wishlist' | 'watched',
    pickedBy: ''
  });

  const movie = movies.find(m => m.id === id);

  // Sorted watched movies for prev/next navigation
  const watchedMovies = movies
    .filter(m => m.status === 'watched')
    .sort((a, b) => {
      const aDate = a.date === 'Unknown' ? null : a.date;
      const bDate = b.date === 'Unknown' ? null : b.date;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  const currentIdx = watchedMovies.findIndex(m => m.id === id);
  const prevMovie = currentIdx > 0 ? watchedMovies[currentIdx - 1] : null;
  const nextMovie = currentIdx !== -1 && currentIdx < watchedMovies.length - 1 ? watchedMovies[currentIdx + 1] : null;

  React.useEffect(() => {
    setHasAttemptedFetch(false);
  }, [id]);

  // Only populate edit form when entering edit mode
  React.useEffect(() => {
    if (isEditing && movie) {
      setEditForm({
        date: movie.date || '',
        status: movie.status || 'wishlist',
        pickedBy: movie.pickedBy || ''
      });
    }
  }, [isEditing]);

  // Handle movie changes (like navigation)
  React.useEffect(() => {
    if (movie && !isEditing) {
      setEditForm({
        date: movie.date || '',
        status: movie.status || 'wishlist',
        pickedBy: movie.pickedBy || ''
      });
    }
  }, [movie?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    // Auto-fetch metadata if missing
    if (movie && (!movie.poster_url || movie.poster_url.trim() === '') && !isRefreshing && !hasAttemptedFetch) {
      handleRefreshMetadata();
    }
  }, [movie?.id, movie?.poster_url, isRefreshing, hasAttemptedFetch]);

  const handleRefreshMetadata = async () => {
    if (!movie || isRefreshing) return;

    setIsRefreshing(true);
    setHasAttemptedFetch(true);
    try {
      console.log(`Fetching metadata for ${movie.title}...`);
      // Since this movie is already in our DB, we don't want to filter out R-rated movies
      // (in case we watched one), and we definitely DON'T want to use movie.date as the 
      // release year since movie.date is the date we *watched* it.
      let bestMatch: any = null;

      if (movie.tmdbId && /^\d+$/.test(String(movie.tmdbId))) {
        bestMatch = await getMovieDetails(Number(movie.tmdbId));
      }

      if (!bestMatch) {
        const results = await searchMovies(movie.title, undefined, true);
        bestMatch = pickBestMovieMatch(movie.title, results);
      }

      if (bestMatch) {
        console.log("Found match:", bestMatch);

        // Always save as a full absolute URL for consistency
        const fullPosterUrl = bestMatch.poster_path
          ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`
          : '';

        await updateMovie(movie.id, {
          poster_url: fullPosterUrl,
          summary: bestMatch.overview,
          trailerKey: bestMatch.trailerKey,
          genres: bestMatch.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean),
          tmdbId: String(bestMatch.id)
        });
        toast.success(`Metadata refreshed for ${movie.title}`);
      } else {
        toast.error(`No metadata found for "${movie.title}"`);
        console.warn("No results found for", movie.title);
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

  const handleRatingToggle = (profileId: string, star: number) => {
    const currentRating = movie?.ratings[profileId] || 0;
    let newRating = star;

    // If tapping the SAME full star, toggle to half
    if (currentRating === star) {
      newRating = star - 0.5;
    }
    // If tapping the SAME half star, reset to 0
    else if (currentRating === star - 0.5) {
      newRating = 0;
    }

    handleRatingChange(profileId, newRating);
    if (newRating % 1 !== 0) hapticFeedback.light();
    else hapticFeedback.medium();
  };

  const getPosterSrc = (url: string) => {
    if (url.startsWith('http')) return url;
    return `https://image.tmdb.org/t/p/w500${url}`;
  };

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-black uppercase tracking-widest text-theme-muted">Movie not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-theme-primary text-theme-base font-black rounded-xl uppercase text-xs tracking-widest"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateMovie(movie.id, {
        date: editForm.date || '',
        status: editForm.status || 'wishlist',
        pickedBy: editForm.pickedBy || 'Family'
      });
      setIsEditing(false);
      toast.success('Movie details updated successfully!');
    } catch (error: any) {
      handleError(error, "Failed to save changes");
    }
  };

  const handleRatingChange = async (memberId: string, rating: number) => {
    try {
      const newRatings = { ...movie.ratings, [memberId]: rating };
      await updateMovie(movie.id, { ratings: newRatings });
    } catch (error) {
      handleError(error, "Failed to update rating");
    }
  };

  const handleDelete = async () => {
    try {
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
    } catch (error) {
      handleError(error, "Failed to delete movie");
    }
  };

  const handlePlexRequest = async () => {
    setIsSending(true);
    try {
      const success = await sendRequestEmail(
        'movie',
        movie.title,
        'Plex request from Family Movie App'
      );

      if (success) {
        showModal({
          type: 'alert',
          title: 'Request Sent!',
          message: `Dad has been asked to add "${movie.title}" to Plex. 🍿`,
          confirmText: 'Awesome'
        });
      } else {
        throw new Error('Failed to send the request email.');
      }
    } catch (error) {
      handleError(error, "Failed to send Plex request");
    } finally {
      setIsSending(false);
    }
  };

  const trailerUrl = movie.trailerKey
    ? `https://www.youtube.com/watch?v=${movie.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 md:py-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        {/* Prev / Next through watched movies */}
        {currentIdx !== -1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevMovie && navigate(`/movie/${prevMovie.id}`)}
              disabled={!prevMovie}
              title={prevMovie ? prevMovie.title : ''}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-theme-border hover:border-theme-primary hover:text-theme-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="text-[10px] text-theme-muted font-mono">{currentIdx + 1} / {watchedMovies.length}</span>
            <button
              onClick={() => nextMovie && navigate(`/movie/${nextMovie.id}`)}
              disabled={!nextMovie}
              title={nextMovie ? nextMovie.title : ''}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-theme-border hover:border-theme-primary hover:text-theme-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Poster Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 flex flex-col items-center md:items-start"
        >
          <div className={`aspect-[2/3] w-[40%] md:w-full rounded-2xl overflow-hidden border border-theme-border shadow-xl relative group`}>
            {movie.poster_url ? (
              <img
                src={getPosterSrc(movie.poster_url)}
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}

            {/* Fallback / Placeholder (shown if no URL or if load fails) */}
            <div className={`w-full h-full bg-theme-surface flex flex-col items-center justify-center p-4 text-center ${movie.poster_url ? 'hidden' : ''}`}>
              <span className="text-theme-muted font-black uppercase tracking-widest opacity-20 text-sm">{movie.title}</span>

              <button
                onClick={generateWatchPartyPack}
                className="p-2 text-theme-muted hover:text-theme-primary transition-colors opacity-70 hover:opacity-100"
                title="Generate Watch Party Pack"
              >
                🎉
              </button>
              <button
                onClick={handleRefreshMetadata}
                disabled={isRefreshing}
                className="mt-4 p-2 text-theme-primary hover:bg-theme-primary/10 rounded-full transition-colors"
                title="Retry loading poster"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-theme-text leading-none ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                {movie.title}
              </h1>

              {watchPartyPack && (
                <div className="p-4 rounded-2xl border border-theme-border bg-theme-surface/40 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-theme-primary flex items-center gap-2">
                    <Sparkles size={14} className="animate-pulse" /> AI Watch Party Pack
                  </h3>
                  <p className="text-xs text-theme-text font-medium"><span className="opacity-50">Snack:</span> {watchPartyPack.snack}</p>
                  <p className="text-xs text-theme-text font-medium"><span className="opacity-50">Activity:</span> {watchPartyPack.activity}</p>
                  <p className="text-xs text-theme-text font-medium"><span className="opacity-50">Discussion:</span> {watchPartyPack.prompt}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {isEditing ? (
                <MovieEditForm
                  editForm={editForm}
                  setEditForm={setEditForm}
                  profiles={profiles}
                  handleSave={handleSave}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <>
                  <button
                    onClick={generateWatchPartyPack}
                    disabled={isGeneratingPack}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-primary text-theme-base font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-theme-primary/20 disabled:opacity-50"
                  >
                    <Sparkles size={14} className={isGeneratingPack ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
                    {isGeneratingPack ? 'Thinking...' : 'Party Pack'}
                  </button>
                  <span className="w-1 h-1 rounded-full bg-theme-border mx-1" />
                  {movie.date && (
                    <span className="text-xs font-mono text-theme-muted uppercase tracking-widest">{movie.date}</span>
                  )}
                  <span className="w-1 h-1 rounded-full bg-theme-border mx-1" />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: profiles.find(p => p.id === movie.pickedBy)?.color || 'inherit' }}>
                    {profiles.find(p => p.id === movie.pickedBy)?.name || movie.pickedBy}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-theme-border mx-1" />
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${movie.status === 'watched' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-amber-500/30 text-amber-500 bg-amber-500/10'}`}>
                    {movie.status === 'watched' ? 'Watched' : 'Wishlist'}
                  </span>
                  <button onClick={() => setIsEditing(true)} className="ml-2 text-theme-muted hover:text-theme-primary transition-colors opacity-50 hover:opacity-100">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={handleRefreshMetadata}
                    disabled={isRefreshing}
                    className="ml-2 text-theme-muted hover:text-theme-primary transition-colors opacity-50 hover:opacity-100"
                    title="Refresh Metadata"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </>
              )}
            </div>

            {movie.summary && (
              <p className="text-sm text-theme-muted leading-relaxed mt-2 max-w-2xl">
                {movie.summary}
              </p>
            )}
          </div>

          {/* Rankings Section */}
          <section className="bg-theme-surface/30 border border-theme-border rounded-2xl p-4 md:p-6 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-theme-primary">
                <Star size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Family Rankings</h2>
              </div>
              <div className="text-[10px] font-mono text-theme-muted uppercase">Tap star again to toggle half</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-theme-base/50 border border-theme-border/50 rounded-xl px-4 py-2 flex items-center justify-between group/rank"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]" style={{ color: profile.color }}>
                    {profile.name}
                  </span>

                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="flex items-center -space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = movie.ratings[profile.id] || 0;
                        const isFull = star <= currentRating;
                        const isHalf = star - 0.5 === currentRating;

                        return (
                          <div key={star} className="relative flex items-center h-10 w-8 group/star select-none">
                            <button
                              onClick={() => { hapticFeedback.light(); handleRatingToggle(profile.id, star); }}
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
                      <svg width="0" height="0" className="absolute">
                        <defs>
                          <linearGradient id="halfStarDetail" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-[10px] font-mono font-black text-theme-text w-6 text-right tabular-nums">
                      {movie.ratings[profile.id] > 0 ? movie.ratings[profile.id] : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="pt-2">
            <MovieActions
              movie={movie}
              trailerUrl={trailerUrl}
              isSending={isSending}
              handlePlexRequest={handlePlexRequest}
              markWatched={markWatched}
              handleDelete={handleDelete}
            />
          </div>
        </motion.div >
      </div >
    </div >
  );
}
