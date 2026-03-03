import React from 'react';
import { Youtube, Mail } from 'lucide-react';
import { Movie } from '../../contexts/DataContext';

interface MovieActionsProps {
  movie: Movie;
  trailerUrl: string;
  isSending: boolean;
  handlePlexRequest: () => void;
  markWatched: (id: string) => void;
  handleDelete: () => void;
}

export function MovieActions({ movie, trailerUrl, isSending, handlePlexRequest, markWatched, handleDelete }: MovieActionsProps) {
  return (
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
  );
}
