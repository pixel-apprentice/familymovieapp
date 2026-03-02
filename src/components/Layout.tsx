import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrentTurn } from './CurrentTurn';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Home, Settings } from 'lucide-react';
import { PizzaButton } from './PizzaButton';
import { hapticFeedback } from '../utils/haptics';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isLocalMode } = useData();
  const { theme } = useTheme();
  const location = useLocation();

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-700`}>
      {theme === 'modern-pinnacle' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
        </div>
      )}
      {theme === 'modern-luminous' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>
      )}
      
      {isLocalMode && (
        <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center py-2 px-4 shadow-xl z-50 relative animate-pulse">
          <span>⚠️ Setup Required: Add Firebase Environment Variables to Sync Data</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-theme-base/60 backdrop-blur-xl border-b border-theme-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:p-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center text-theme-base font-black text-lg shadow-lg group-hover:scale-110 transition-transform`}>
              F
            </div>
            <h1 className={`text-xl md:text-2xl font-black tracking-tighter text-theme-primary`}>
              Family Movie Night
            </h1>
          </Link>
          
          <nav className="flex items-center gap-1 md:gap-2">
            <Link 
              to="/" 
              onClick={() => hapticFeedback.light()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/' 
                  ? 'bg-theme-primary text-theme-base shadow-lg' 
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
              }`}
            >
              <Home size={14} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <PizzaButton />
            <Link 
              to="/stats" 
              onClick={() => hapticFeedback.light()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/stats' 
                  ? 'bg-theme-primary text-theme-base shadow-lg' 
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
              }`}
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Settings</span>
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

