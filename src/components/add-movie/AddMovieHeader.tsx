import React from 'react';
import { X } from 'lucide-react';
import { TMDBMovie } from '../../services/tmdb';
import { useTheme } from '../../contexts/ThemeContext';

interface AddMovieHeaderProps {
  movie: TMDBMovie;
  onClose: () => void;
}

export function AddMovieHeader({ movie, onClose }: AddMovieHeaderProps) {
  const { theme } = useTheme();
  return (
    <>
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
        <div className="w-12 h-1.5 bg-theme-border rounded-full" />
      </div>

      <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-theme-border flex items-center justify-between shrink-0">
        <h2 className="text-xl font-black uppercase tracking-widest text-theme-primary">
          {theme === 'mooooovies' ? 'Add to Herd' :
           theme === 'drive-in' ? 'Add to Marquee' :
           theme === 'blockbuster' ? 'Reserve Tape' :
           theme === 'sci-fi-hologram' ? 'Save Log' :
           theme === 'golden-age' ? 'Cast Picture' :
           'Add Movie'}
        </h2>
        <button onClick={onClose} className="p-2 -mr-2 text-theme-muted hover:text-theme-text transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex gap-4 mb-8 px-6 pt-6">
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
    </>
  );
}
