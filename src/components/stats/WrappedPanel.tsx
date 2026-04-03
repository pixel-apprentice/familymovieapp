import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Sparkles, X, Trophy, Film, Zap, Heart } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { hapticFeedback } from '../../utils/haptics';

interface WrappedData {
  totalWatched: number;
  topPickerName: string;
  topPickerCount: number;
  topGenres: string[];
  movieOfTheYear: { title: string; poster_url: string; avgRating: string };
  year: number;
  personalityLabel: string;
  genreVibe: string;
  topPickerSummary: string;
  movieOfYearInsight: string;
  familyRoast: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchWrapped(movies: any[], profiles: any[]): Promise<WrappedData> {
  const year = new Date().getFullYear();
  const res = await fetch(`${API_BASE}/gemini/wrapped`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movies, profiles, year }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to generate Wrapped');
  }
  return res.json();
}

// ─── Individual Slide Components ────────────────────────────────────────────

function SlideOpener({ data }: { data: WrappedData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full px-8">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="text-7xl"
      >🎬</motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-primary/60">Your {data.year} in Review</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-theme-text leading-tight">
          {data.personalityLabel}
        </h2>
        <p className="text-base text-theme-muted font-medium max-w-xs leading-relaxed">
          {data.genreVibe}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-primary/40"
      >
        {data.totalWatched} movies watched
      </motion.div>
    </div>
  );
}

function SlideTopPicker({ data }: { data: WrappedData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full px-8">
      <motion.div
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400"
      >
        <Trophy size={36} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/70">Top Picker</p>
        <h2 className="text-5xl font-black tracking-tight text-theme-text">{data.topPickerName}</h2>
        <p className="text-2xl font-black text-amber-400">{data.topPickerCount} movies picked</p>
        <p className="text-sm text-theme-muted font-medium max-w-xs leading-relaxed mt-2">{data.topPickerSummary}</p>
      </motion.div>
    </div>
  );
}

function SlideGenreVibe({ data }: { data: WrappedData }) {
  const colors = ['bg-violet-500/20 text-violet-300 border-violet-500/30', 'bg-blue-500/20 text-blue-300 border-blue-500/30', 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'];
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full px-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-violet-500/20 border-2 border-violet-500/40 flex items-center justify-center text-violet-400"
      >
        <Film size={36} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400/70">Your Genre Vibe</p>
        <div className="flex flex-wrap justify-center gap-2">
          {data.topGenres.map((g, i) => (
            <motion.span key={g}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className={`px-4 py-2 rounded-full border font-black text-xs uppercase tracking-widest ${colors[i % colors.length]}`}
            >{g}</motion.span>
          ))}
        </div>
        <p className="text-sm text-theme-muted font-medium max-w-xs leading-relaxed">{data.genreVibe}</p>
      </motion.div>
    </div>
  );
}

function SlideMovieOfYear({ data }: { data: WrappedData }) {
  const { movieOfTheYear } = data;
  return (
    <div className="flex flex-col items-center justify-center gap-5 text-center h-full px-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/70 mb-3">Movie of the Year</p>
      </motion.div>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
        className="relative"
      >
        {movieOfTheYear.poster_url ? (
          <div className="w-32 h-48 rounded-2xl overflow-hidden ring-4 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
            <img src={movieOfTheYear.poster_url} alt={movieOfTheYear.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-32 h-48 rounded-2xl bg-theme-surface border-2 border-amber-400/30 flex items-center justify-center text-4xl">🎬</div>
        )}
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
          <Star size={18} className="text-black" fill="black" />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <h2 className="text-2xl font-black tracking-tight text-theme-text max-w-[260px] leading-tight">{movieOfTheYear.title}</h2>
        <p className="text-amber-400 font-black text-lg">★ {movieOfTheYear.avgRating} / 5</p>
        <p className="text-sm text-theme-muted font-medium max-w-xs leading-relaxed">{data.movieOfYearInsight}</p>
      </motion.div>
    </div>
  );
}

function SlideRoast({ data }: { data: WrappedData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full px-8">
      <motion.div initial={{ scale: 0, rotate: 15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-pink-500/20 border-2 border-pink-500/40 flex items-center justify-center text-pink-400"
      >
        <Heart size={36} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400/70">The Family Verdict</p>
        <p className="text-xl md:text-2xl font-black text-theme-text leading-snug max-w-sm italic">
          "{data.familyRoast}"
        </p>
        <p className="text-[10px] font-mono text-theme-muted/60 uppercase tracking-widest mt-2">
          — Gemini, Honorary Family Member
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WrappedPanel() {
  const { movies, profiles } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const SLIDES = wrappedData
    ? [SlideOpener, SlideTopPicker, SlideGenreVibe, SlideMovieOfYear, SlideRoast]
    : [];

  const handleOpen = async () => {
    hapticFeedback.medium();
    setIsOpen(true);
    if (wrappedData) return; // Already loaded
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWrapped(movies, profiles);
      setWrappedData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate your Wrapped');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    hapticFeedback.light();
    setIsOpen(false);
    setSlideIndex(0);
  };

  const nextSlide = () => {
    hapticFeedback.light();
    setSlideIndex(i => Math.min(i + 1, SLIDES.length - 1));
  };

  const prevSlide = () => {
    hapticFeedback.light();
    setSlideIndex(i => Math.max(i - 1, 0));
  };

  const watchedCount = movies.filter(m => m.status === 'watched').length;

  return (
    <>
      {/* Entry card on Stats page */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="w-full relative overflow-hidden rounded-3xl border-2 border-theme-primary/20 bg-gradient-to-br from-theme-surface via-theme-surface to-theme-primary/5 p-6 text-left shadow-xl touch-manipulation group"
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-theme-primary/20 flex items-center justify-center text-2xl shrink-0">
            🎬
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">AI Powered</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-theme-text">Family Movie Wrapped</h3>
            <p className="text-sm text-theme-muted mt-0.5">
              {watchedCount} movies · Your year in review ✨
            </p>
          </div>
          <Zap size={20} className="text-theme-primary/30 group-hover:text-theme-primary/60 transition-colors shrink-0" />
        </div>
      </motion.button>

      {/* Full-screen slideshow overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-theme-base/95 backdrop-blur-2xl flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-theme-surface/80 border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors touch-manipulation"
            >
              <X size={18} />
            </button>

            {/* Content area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {isLoading && (
                <div className="flex flex-col items-center gap-6">
                  <div className="text-5xl animate-bounce">🎬</div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-theme-primary animate-pulse">
                      Generating Your Wrapped…
                    </p>
                    <p className="text-xs text-theme-muted">Gemini is reviewing your movie history</p>
                  </div>
                  <div className="w-32 h-1 bg-theme-border rounded-full overflow-hidden">
                    <div className="h-full bg-theme-primary animate-[shimmer_1.5s_infinite] w-full" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center gap-4 px-8 text-center">
                  <span className="text-4xl">😕</span>
                  <p className="font-black text-theme-text">Couldn't generate your Wrapped</p>
                  <p className="text-sm text-theme-muted">{error}</p>
                  <button onClick={handleOpen} className="px-6 py-3 bg-theme-primary text-theme-base font-black rounded-xl text-xs uppercase tracking-widest">
                    Try Again
                  </button>
                </div>
              )}

              {wrappedData && SLIDES.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="w-full max-w-sm h-full flex items-center justify-center"
                  >
                    {React.createElement(SLIDES[slideIndex], { data: wrappedData })}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Navigation footer */}
            {wrappedData && (
              <div className="pb-8 px-6 flex flex-col items-center gap-4">
                {/* Dot indicators */}
                <div className="flex items-center gap-2">
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setSlideIndex(i)}
                      className={`rounded-full transition-all duration-300 ${i === slideIndex ? 'w-6 h-2 bg-theme-primary' : 'w-2 h-2 bg-theme-border'}`}
                    />
                  ))}
                </div>

                {/* Prev / Next */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevSlide}
                    disabled={slideIndex === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation font-black text-xs uppercase tracking-widest"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  {slideIndex < SLIDES.length - 1 ? (
                    <button
                      onClick={nextSlide}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-theme-primary text-theme-base font-black text-xs uppercase tracking-widest shadow-lg touch-manipulation"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg touch-manipulation"
                    >
                      Done ✓
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
