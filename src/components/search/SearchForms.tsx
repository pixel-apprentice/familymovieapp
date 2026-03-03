import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticFeedback } from '../../utils/haptics';

interface SearchFormsProps {
  query: string;
  setQuery: (query: string) => void;
  vibe: string;
  setVibe: (vibe: string) => void;
  loading: boolean;
  handleSearch: (e: React.FormEvent) => void;
  handleVibeSearch: (e: React.FormEvent) => void;
  handleRecommend: () => void;
}

export function SearchForms({
  query,
  setQuery,
  vibe,
  setVibe,
  loading,
  handleSearch,
  handleVibeSearch,
  handleRecommend
}: SearchFormsProps) {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSearch} className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted">Direct Search</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Title, Actor..."
            className="flex-1 min-w-0 bg-theme-base border border-theme-border rounded-2xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all shadow-inner"
          />
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={loading} onClick={() => hapticFeedback.light()} className="px-4 py-3 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-lg uppercase text-[10px] tracking-widest shrink-0">
            Search
          </motion.button>
        </div>
      </form>

      <form onSubmit={handleVibeSearch} className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted flex items-center gap-2">
          <span className="text-theme-accent animate-twinkle">✨</span> {theme === 'neon-cyberpunk' ? 'Neural Vibe Analysis' : 'Vibe Search'}
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={vibe} 
            onChange={e => setVibe(e.target.value)} 
            placeholder="Describe a mood or genre"
            className="flex-1 min-w-0 bg-theme-base border border-theme-border rounded-2xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all shadow-inner"
          />
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={loading} onClick={() => hapticFeedback.light()} className="px-4 py-3 bg-theme-accent text-theme-base font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-lg uppercase text-[10px] tracking-widest shrink-0">
            Analyze
          </motion.button>
        </div>
      </form>

      <div className="space-y-3 flex flex-col justify-end">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.medium(); handleRecommend(); }} 
          disabled={loading} 
          className="w-full py-4 px-6 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-3"
        >
          <span className="text-lg animate-pulse">✨</span> Surprise me!
        </motion.button>
      </div>
    </div>
  );
}