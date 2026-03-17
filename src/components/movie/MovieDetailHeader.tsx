import React from 'react';
import { Movie, FamilyProfile } from '../../types/movie';
import { motion } from 'motion/react';
import { RefreshCw, Edit2 } from 'lucide-react';
import { MovieEditForm } from './MovieEditForm';
import { getPosterUrl } from '../../constants/movies';

interface MovieDetailHeaderProps {
  movie: Movie;
  isEditing: boolean;
  editForm: { date: string; status: 'wishlist' | 'watched'; pickedBy: string };
  setEditForm: (form: MovieDetailHeaderProps['editForm']) => void;
  profiles: FamilyProfile[];
  handleSave: () => Promise<void>;
  setIsEditing: (val: boolean) => void;
  handleRefreshMetadata: () => Promise<void>;
  isRefreshing: boolean;
  generateWatchPartyPack: () => Promise<void>;
  isGeneratingPack: boolean;
  Sparkles: React.ElementType;
}

export function MovieDetailHeader({
  movie,
  isEditing,
  editForm,
  setEditForm,
  profiles,
  handleSave,
  setIsEditing,
  handleRefreshMetadata,
  isRefreshing,
  generateWatchPartyPack,
  isGeneratingPack,
  Sparkles
}: MovieDetailHeaderProps) {
  const pickedByProfile = profiles.find(p => p.id === movie.pickedBy);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      {/* Poster Section */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 flex flex-col items-center md:items-start">
        <div className="aspect-[2/3] w-[50%] md:w-full max-h-[75vh] rounded-2xl overflow-hidden border border-theme-border shadow-xl relative group flex items-center justify-center">
          {movie.poster_url ? (
            <img 
              src={getPosterUrl(movie.poster_url)} 
              alt={movie.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
            />
          ) : null}
          <div className={`w-full h-full bg-theme-surface flex flex-col items-center justify-center p-4 text-center ${movie.poster_url ? 'hidden' : ''}`}>
            <span className="text-theme-muted font-black uppercase tracking-widest opacity-20 text-sm">{movie.title}</span>
            <button 
              onClick={handleRefreshMetadata} 
              disabled={isRefreshing} 
              className="mt-4 p-2 text-theme-primary hover:bg-theme-primary/10 rounded-full transition-colors"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content Section */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-theme-text leading-tight">{movie.title}</h1>
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
                {movie.date && <span className="text-xs font-mono text-theme-muted uppercase tracking-widest">{movie.date}</span>}
                <span className="w-1 h-1 rounded-full bg-theme-border mx-1" />
                <span 
                  className="text-xs font-black uppercase tracking-widest" 
                  style={{ color: pickedByProfile?.color || 'inherit' }}
                >
                  {pickedByProfile?.name || movie.pickedBy}
                </span>
                <span className="w-1 h-1 rounded-full bg-theme-border mx-1" />
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border transition-all ${movie.status === 'watched' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-md' : 'border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-md'}`}>
                  {movie.status === 'watched' ? 'Watched' : 'Wishlist'}
                </span>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="ml-2 text-theme-muted hover:text-theme-primary transition-colors opacity-50 hover:opacity-100"
                >
                  <Edit2 size={14} />
                </button>
              </>
            )}
          </div>
          {movie.summary && <p className="text-sm text-theme-muted leading-relaxed mt-2 max-w-2xl">{movie.summary}</p>}
        </div>
      </motion.div>
    </div>
  );
}
