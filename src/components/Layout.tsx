import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrentTurn } from './CurrentTurn';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Home, Settings } from 'lucide-react';
import { PizzaButton } from './PizzaButton';
import { CastButton } from './CastButton';
import { hapticFeedback } from '../utils/haptics';
import { PWAStatusBar } from './PWAStatusBar';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isLocalMode, syncStatus } = useData();
  const { theme } = useTheme();
  const location = useLocation();

  const isCouchMode = sessionStorage.getItem('fmn_couch_mode') === 'true' || location.search.includes('couch=true');

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-700 ${isCouchMode ? 'couch-mode-active' : ''}`}>
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
          <span>⚠️ Local Mode: Check Firebase Keys & Enable Anonymous Auth</span>
        </div>
      )}

      <PWAStatusBar />

      {!isCouchMode && (
        <header className="sticky top-0 z-40 bg-theme-base/60 backdrop-blur-xl border-b border-theme-border/50">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:p-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className={`w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center text-theme-base font-black text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                F
              </div>
              <h1 className={`text-xl md:text-2xl font-black tracking-tighter text-theme-primary`}>
                {theme === 'mooooovies' ? 'Pizza Mooovie Night' :
                  theme === 'drive-in' ? 'Drive-In Pizza Night' :
                    theme === 'blockbuster' ? 'Blockbuster Pizza' :
                      theme === 'sci-fi-hologram' ? 'Holo-Deck Pizza' :
                        theme === 'golden-age' ? 'Golden Age Pizza' :
                          'Pizza Movie Night'}
              </h1>
            </Link>

            <div className="hidden md:flex items-center mr-2">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${syncStatus === 'synced' ? 'bg-emerald-500/20 text-emerald-400' :
                syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-400' :
                  syncStatus === 'offline' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-theme-border/40 text-theme-muted'
                }`}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Local'}
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                to="/"
                onClick={() => hapticFeedback.light()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/'
                  ? 'bg-theme-primary text-theme-base shadow-lg'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                  }`}
                title="Home"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <PizzaButton />
              <CastButton />
              <Link
                to="/stats"
                onClick={() => hapticFeedback.light()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/stats'
                  ? 'bg-theme-primary text-theme-base shadow-lg'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                  }`}
                title="Settings"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 flex flex-col gap-6 md:gap-8 ${isCouchMode ? 'max-w-none px-12 md:px-24' : ''}`}>
        {location.pathname === '/' && !isCouchMode && (
          <section className="w-full flex justify-center">
            <CurrentTurn />
          </section>
        )}

        <div className="space-y-8 md:space-y-12">
          {children}
        </div>
      </main>
    </div>
  );
}

