import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Movie } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Info, Edit2, RefreshCw } from 'lucide-react';
import { sendRequestEmail } from '../services/emailService';
import { searchMovies, GENRE_MAP } from '../services/tmdb';
import { handleError } from '../utils/errorHandler';
import { toast } from 'sonner';
import { MovieEditForm } from '../components/movie/MovieEditForm';
import { MovieActions } from '../components/movie/MovieActions';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { movies, updateMovie, markWatched, removeMovie, profiles } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
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
      const results = await searchMovies(movie.title, undefined, true);

      if (results && results.length > 0) {
        const bestMatch = results[0];
        console.log("Found match:", bestMatch);

        // Always save as a full absolute URL for consistency
        const fullPosterUrl = bestMatch.poster_path
          ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`
          : '';

        await updateMovie(movie.id, {
          poster_url: fullPosterUrl,
          summary: bestMatch.overview,
          trailerKey: bestMatch.trailerKey,
          genres: bestMatch.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean)
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
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
          className="space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className={`text-4xl md:text-6xl font-black leading-none text-theme-text ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                {movie.title}
              </h1>
              <button
                onClick={handleRefreshMetadata}
                disabled={isRefreshing}
                className="p-2 text-theme-muted hover:text-theme-primary transition-colors opacity-50 hover:opacity-100"
                title="Refresh Metadata"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
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
                  {movie.date && (
                    <span className="text-xs font-mono text-theme-muted uppercase tracking-widest">{movie.date}</span>
                  )}
                  <span className="w-1 h-1 rounded-full bg-theme-border" />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: profiles.find(p => p.id === movie.pickedBy)?.color || 'inherit' }}>
                    Picked by {profiles.find(p => p.id === movie.pickedBy)?.name || movie.pickedBy}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-theme-border" />
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${movie.status === 'watched' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-amber-500/30 text-amber-500 bg-amber-500/10'}`}>
                    {movie.status === 'watched' ? (
                      theme === 'mooooovies' ? 'Grazed' :
                      theme === 'drive-in' ? 'Screened' :
                      theme === 'blockbuster' ? 'Returned' :
                      theme === 'sci-fi-hologram' ? 'Archived' :
                      theme === 'golden-age' ? 'Wrapped' :
                      'Watched'
                    ) : (
                      theme === 'mooooovies' ? 'Pasture' :
                      theme === 'drive-in' ? 'Marquee' :
                      theme === 'blockbuster' ? 'Reserved' :
                      theme === 'sci-fi-hologram' ? 'Pending' :
                      theme === 'golden-age' ? 'Scheduled' :
                      'Wishlist'
                    )}
                  </span>
                  <button onClick={() => setIsEditing(true)} className="ml-2 text-theme-muted hover:text-theme-primary transition-colors opacity-50 hover:opacity-100">
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map(genre => (
                  <span key={genre} className="px-2 py-1 text-[10px] font-black uppercase tracking-widest border border-theme-border rounded-md text-theme-muted">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {movie.summary && (
              <p className="text-sm text-theme-muted leading-relaxed mt-6 max-w-2xl">
                {movie.summary}
              </p>
            )}
          </div>

          {/* Actions */}
          <MovieActions
            movie={movie}
            trailerUrl={trailerUrl}
            isSending={isSending}
            handlePlexRequest={handlePlexRequest}
            markWatched={markWatched}
            handleDelete={handleDelete}
          />

          {/* Family Rankings Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-theme-primary">
              <Star size={18} />
              <h2 className="text-sm font-black uppercase tracking-widest">Family Rankings</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-theme-surface border border-theme-border rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: profile.color }}>
                      {profile.name}
                    </span>
                    <span className="text-xs font-mono text-theme-muted">
                      {movie.ratings[profile.id] > 0 ? `${movie.ratings[profile.id]}/5` : 'Not rated'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(profile.id, star)}
                        className={`p-1 transition-all hover:scale-125 ${star <= (movie.ratings[profile.id] || 0)
                          ? 'text-theme-primary'
                          : 'text-theme-muted opacity-20'
                          }`}
                      >
                        <Star size={20} fill={star <= (movie.ratings[profile.id] || 0) ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
