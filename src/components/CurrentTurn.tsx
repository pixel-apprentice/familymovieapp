import React from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { hapticFeedback } from '../utils/haptics';

export function CurrentTurn() {
  const { currentTurnIndex, skipTurn, setTurn, movies, profiles } = useData();
  const { theme } = useTheme();
  
  const currentPicker = profiles[currentTurnIndex]?.name || 'Family';

  // Find the last watched movie
  const lastWatched = [...movies]
    .filter(m => m.status === 'watched' && m.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  const daysAgo = lastWatched?.date ? Math.floor((new Date().getTime() - new Date(lastWatched.date).getTime()) / (1000 * 3600 * 24)) : null;

  const commonStyles = `${
    theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
  } ${
    theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
  } ${
    theme === 'vintage-ticket' ? 'rounded-xl border-amber-900/20 shadow-sm bg-amber-50/50' : ''
  }`;

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col gap-2">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center justify-between p-2 pl-4 md:pl-6 pr-2 rounded-[2rem] bg-theme-surface border-2 border-theme-border shadow-xl ${commonStyles}`}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className={`text-[8px] md:text-[10px] uppercase tracking-widest text-theme-muted font-black opacity-80 ${theme === 'vintage-ticket' ? 'font-serif italic tracking-widest' : ''}`}>
            {theme === 'neon-cyberpunk' ? 'ACTIVE_USER' : 'Up Next'}
          </span>
          <h1 className={`text-xl md:text-3xl font-black text-theme-primary truncate ${
            theme === 'velvet-theater' ? 'font-serif italic drop-shadow-[0_2px_0_#713f12] text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600' : ''
          } ${
            theme === 'neon-cyberpunk' ? 'drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : ''
          } ${
            theme === 'vintage-ticket' ? 'font-serif text-amber-900' : ''
          }`}>
            {currentPicker}
          </h1>
        </div>
        
        <div className="flex gap-1 md:gap-2 shrink-0">
          {profiles.map((profile, index) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={profile.id}
              onClick={() => { hapticFeedback.light(); setTurn(index); }}
              className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${
                theme === 'modern-pinnacle' ? 'border border-white/10' : ''
              } ${
                theme === 'modern-luminous' ? 'border border-black/5' : ''
              } ${
                theme === 'vintage-ticket' ? 'ticket-stub rounded-none bg-amber-100 text-amber-900 border-none shadow-sm' : ''
              } ${
                index === currentTurnIndex 
                  ? 'bg-theme-primary text-theme-base scale-110 shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.3)] z-10' 
                  : 'bg-theme-base/50 text-theme-muted hover:bg-theme-border/20 border border-theme-border'
              }`}
            >
              <span className="relative z-10">{profile.name[0]}</span>
              {index === currentTurnIndex && (
                <motion.div 
                  layoutId="active-turn-pill"
                  className={`absolute inset-0 bg-theme-primary opacity-100 z-0 ${
                    theme === 'neon-cyberpunk' ? 'rounded-full blur-sm' : 'rounded-full'
                  }`}
                  style={{ borderRadius: theme === 'vintage-ticket' ? '0' : undefined }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="flex items-center justify-between px-4">
        {lastWatched ? (
          <p className="text-[9px] md:text-[10px] text-theme-muted font-mono uppercase tracking-wider">
            Last: <span className="text-theme-primary font-bold">{profiles.find(p => p.id === lastWatched.pickedBy)?.name || lastWatched.pickedBy}</span> • {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
          </p>
        ) : (
          <div />
        )}
        <button 
          onClick={() => { hapticFeedback.medium(); skipTurn(); }}
          className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted hover:text-theme-primary transition-colors"
        >
          Skip Turn
        </button>
      </div>
    </div>
  );
}



