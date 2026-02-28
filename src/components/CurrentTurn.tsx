import React from 'react';
import { useData, TURN_ORDER } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';

export function CurrentTurn() {
  const { currentTurnIndex, skipTurn, setTurn, movies } = useData();
  const { theme } = useTheme();
  
  const currentPicker = TURN_ORDER[currentTurnIndex];

  // Find the last watched movie
  const lastWatched = [...movies]
    .filter(m => m.status === 'watched' && m.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  const daysAgo = lastWatched?.date ? Math.floor((new Date().getTime() - new Date(lastWatched.date).getTime()) / (1000 * 3600 * 24)) : null;

  const commonStyles = `${
    theme === 'galactic-glow' ? 'bg-nebula shadow-[0_0_30px_rgba(232,121,249,0.2)] backdrop-blur-3xl border-white/10' : ''
  } ${
    theme === 'golden-marquee' ? 'gold-frame bg-red-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' : ''
  } ${
    theme === '8-bit-arcade' ? 'rounded-none border-4 shadow-[4px_4px_0_#000]' : ''
  } ${
    theme === 'enchanted-library' ? 'paper-texture border-double border-4 border-amber-700/50 shadow-inner' : ''
  } ${
    theme === 'cyber-command' ? 'cyber-overlay border-green-500/30 bg-slate-900/80' : ''
  }`;

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col gap-2">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center justify-between p-2 pl-4 md:pl-6 pr-2 rounded-[2rem] bg-theme-surface border-2 border-theme-border shadow-xl ${commonStyles}`}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className={`text-[8px] md:text-[10px] uppercase tracking-widest text-theme-muted font-black opacity-80 ${theme === 'enchanted-library' ? 'font-serif italic tracking-widest' : ''}`}>
            {theme === 'cyber-command' ? 'ACTIVE_USER' : 'Up Next'}
          </span>
          <h1 className={`text-xl md:text-3xl font-black text-theme-primary truncate ${
            theme === 'golden-marquee' ? 'font-serif italic drop-shadow-[0_2px_0_#713f12] text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600' : ''
          } ${
            theme === '8-bit-arcade' ? 'uppercase tracking-tighter drop-shadow-[2px_2px_0_#ef4444]' : ''
          } ${
            theme === 'galactic-glow' ? 'animate-twinkle drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]' : ''
          } ${
            theme === 'cyber-command' ? 'drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : ''
          } ${
            theme === 'enchanted-library' ? 'font-serif text-amber-900' : ''
          }`}>
            {currentPicker}
          </h1>
        </div>
        
        <div className="flex gap-1 md:gap-2 shrink-0">
          {TURN_ORDER.map((member, index) => (
            <button
              key={member}
              onClick={() => setTurn(index)}
              className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${
                theme === '8-bit-arcade' ? 'rounded-none border-2 shadow-[2px_2px_0_#000] active:translate-y-1 active:shadow-none' : ''
              } ${
                theme === 'cyber-command' ? 'plastic-btn rounded-lg border border-green-500/30' : ''
              } ${
                theme === 'golden-marquee' ? 'ticket-stub rounded-none bg-yellow-100 text-red-900 border-none shadow-sm' : ''
              } ${
                index === currentTurnIndex 
                  ? 'bg-theme-primary text-theme-base scale-110 shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.3)] z-10' 
                  : 'bg-theme-base/50 text-theme-muted hover:bg-theme-border/20 border border-theme-border'
              }`}
            >
              <span className="relative z-10">{member[0]}</span>
              {index === currentTurnIndex && (
                <motion.div 
                  layoutId="active-turn-pill"
                  className={`absolute inset-0 bg-theme-primary opacity-100 z-0 ${
                    theme === 'galactic-glow' ? 'rounded-full blur-sm' : 'rounded-full'
                  }`}
                  style={{ borderRadius: theme === '8-bit-arcade' ? '0' : undefined }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex items-center justify-between px-4">
        {lastWatched ? (
          <p className="text-[9px] md:text-[10px] text-theme-muted font-mono uppercase tracking-wider">
            Last: <span className="text-theme-primary font-bold">{lastWatched.pickedBy}</span> • {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
          </p>
        ) : (
          <div />
        )}
        <button 
          onClick={skipTurn}
          className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted hover:text-theme-primary transition-colors"
        >
          Skip Turn
        </button>
      </div>
    </div>
  );
}



