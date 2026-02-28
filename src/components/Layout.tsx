import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrentTurn } from './CurrentTurn';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Home, BarChart2 } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isLocalMode } = useData();
  const { theme } = useTheme();
  const location = useLocation();

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-700 ${
      theme === 'cyber-command' ? 'cyber-overlay' : ''
    } ${
      theme === 'enchanted-library' ? 'paper-texture' : ''
    } ${
      theme === '8-bit-arcade' ? 'pixel-grid' : ''
    }`}>
      {theme === 'galactic-glow' && (
        <div className="fixed inset-0 bg-nebula opacity-40 pointer-events-none z-[-1]" />
      )}
      
      {isLocalMode && (
        <div className="bg-theme-accent text-theme-base text-[10px] font-black uppercase tracking-[0.2em] text-center py-1.5 px-4 shadow-xl z-50 relative">
          <span className="animate-pulse">Running in Local Mode • Add Firebase Config to Sync</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-theme-base/60 backdrop-blur-xl border-b border-theme-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:p-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center text-theme-base font-black text-lg shadow-lg group-hover:scale-110 transition-transform ${theme === '8-bit-arcade' ? 'rounded-none' : ''}`}>
              F
            </div>
            <h1 className={`text-xl md:text-2xl font-black tracking-tighter text-theme-primary ${theme === '8-bit-arcade' ? 'uppercase' : ''}`}>
              Family Movie Night
            </h1>
          </Link>
          
          <nav className="flex items-center gap-2 md:gap-4">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/' 
                  ? 'bg-theme-primary text-theme-base shadow-lg' 
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
              }`}
            >
              <Home size={14} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link 
              to="/stats" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/stats' 
                  ? 'bg-theme-primary text-theme-base shadow-lg' 
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
              }`}
            >
              <BarChart2 size={14} />
              <span className="hidden sm:inline">Stats</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10 flex flex-col gap-8 md:gap-12">
        {location.pathname === '/' && (
          <section className="w-full flex justify-center">
            <CurrentTurn />
          </section>
        )}

        <div className="space-y-12 md:space-y-20">
          {children}
        </div>
      </main>

      <footer className="py-12 text-center text-theme-muted text-[10px] font-mono uppercase tracking-[0.3em] border-t border-theme-border/20 mt-20 bg-theme-surface/30">
        <p>© 2026 Family Movie Night</p>
        <p className="mt-2 opacity-50">Enjoy the show</p>
      </footer>
    </div>
  );
}

