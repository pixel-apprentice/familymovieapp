import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Movie } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { motion } from 'motion/react';
import { ChevronLeft, Star, Youtube, Info, Mail } from 'lucide-react';
import { sendRequestEmail } from '../services/emailService';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { movies, updateMovie, markWatched, removeMovie, profiles } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);
  
  const movie = movies.find(m => m.id === id);

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

  const handleRatingChange = async (memberId: string, rating: number) => {
    const newRatings = { ...movie.ratings, [memberId]: rating };
    await updateMovie(movie.id, { ratings: newRatings });
  };

  const handleDelete = async () => {
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
    setIsSending(true);
    const success = await sendRequestEmail(
      'movie', 
      movie.title, 
      'Plex request from Family Movie App'
    );
    setIsSending(false);

    if (success) {
      showModal({
        type: 'alert',
        title: 'Request Sent!',
        message: `Dad has been asked to add "${movie.title}" to Plex. 🍿`,
        confirmText: 'Awesome'
      });
    } else {
      showModal({
        type: 'alert',
        title: 'Oops',
        message: 'Failed to send the request. Maybe tell him in person?',
        confirmText: 'Okay'
      });
    }
  };

  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' movie trailer')}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors mb-8 group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-8">
        {/* Poster Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className={`aspect-[2/3] rounded-2xl overflow-hidden border border-theme-border shadow-xl`}>
            {movie.poster_url ? (
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_url}`} 
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-theme-surface flex items-center justify-center">
                <span className="text-theme-muted font-black text-center px-4 uppercase tracking-widest opacity-20">{movie.title}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <h1 className={`text-4xl md:text-6xl font-black leading-none text-theme-text ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              {movie.date && (
                <span className="text-xs font-mono text-theme-muted uppercase tracking-widest">{movie.date}</span>
              )}
              <span className="w-1 h-1 rounded-full bg-theme-border" />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: profiles.find(p => p.id === movie.pickedBy)?.color || 'inherit' }}>
                Picked by {profiles.find(p => p.id === movie.pickedBy)?.name || movie.pickedBy}
              </span>
              <span className="w-1 h-1 rounded-full bg-theme-border" />
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${movie.status === 'watched' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-amber-500/30 text-amber-500 bg-amber-500/10'}`}>
                {movie.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg"
            >
              <Youtube size={20} />
              Watch Trailer
            </a>

            {movie.status === 'wishlist' && (
              <button 
                onClick={handlePlexRequest}
                disabled={isSending}
                className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                <Mail size={20} />
                {isSending ? 'Sending...' : 'Ask Dad to put this on Plex'}
              </button>
            )}

            {movie.status === 'wishlist' && (
              <button 
                onClick={() => markWatched(movie.id)}
                className="w-full py-4 bg-theme-primary text-theme-base rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-lg"
              >
                Mark as Watched
              </button>
            )}

            <button 
              onClick={handleDelete}
              className="w-full py-4 bg-red-600/10 text-red-500 border-2 border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg"
            >
              Delete Movie
            </button>
          </div>

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
                        className={`p-1 transition-all hover:scale-125 ${
                          star <= (movie.ratings[profile.id] || 0) 
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
