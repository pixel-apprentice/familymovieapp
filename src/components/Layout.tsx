import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrentTurn } from './CurrentTurn';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Home, Settings, LogOut } from 'lucide-react';
import { PizzaButton } from './PizzaButton';
import { CastButton } from './CastButton';
import { hapticFeedback } from '../utils/haptics';
import { PWAStatusBar } from './PWAStatusBar';
import { isCouchModeEnabled } from '../utils/isCouchMode';
import { PulseNotification } from './PulseNotification';
import { getThemeText } from '../utils/themeDictionary';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isLocalMode, syncStatus, pulseEvent } = useData();
  const { theme } = useTheme();
  const location = useLocation();

  const isCouchMode = isCouchModeEnabled();

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-700 ${isCouchMode ? `couch-mode-active couch-theme-${theme}` : ''}`} data-testid="app-ready">
      {/* Global SVG Gradients */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="halfStarDetail" x1="0" x2="100%" y1="0" y2="0">
            <stop offset="50%" stopColor="#fbbf24" /> {/* amber-400 */}
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      {/* ... existing theme backgrounds ... */}
      
      {isCouchMode && <PulseNotification event={pulseEvent} />}
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
        <header className="sticky top-0 z-40 bg-theme-base/95 backdrop-blur-xl border-b-2 border-theme-border/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
            <Link to="/" className="flex items-center group">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-theme-primary transition-transform group-hover:scale-[1.01]">
                {getThemeText(theme, 'appTitle')}
              </h1>
            </Link>

            <div className="hidden lg:flex items-center mr-auto ml-8">
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${syncStatus === 'synced' ? 'bg-emerald-500/10 text-emerald-400' :
                syncStatus === 'syncing' ? 'bg-blue-500/10 text-blue-400' :
                  syncStatus === 'offline' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-theme-border/40 text-theme-muted'
                }`}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Local'}
              </span>
            </div>

            <nav className="flex items-center gap-2">
              <Link
                to="/"
                onClick={() => hapticFeedback.light()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/'
                  ? 'bg-theme-primary text-theme-base shadow-lg shadow-theme-primary/10'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/5'
                  }`}
                title="Home"
              >
                <Home size={18} />
                <span className="hidden md:inline">Home</span>
              </Link>
              <PizzaButton />
              <CastButton />
              <Link
                to="/stats"
                onClick={() => hapticFeedback.light()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/stats'
                  ? 'bg-theme-primary text-theme-base shadow-lg shadow-theme-primary/10'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/5'
                  }`}
                title="Settings"
              >
                <Settings size={18} />
                <span className="hidden md:inline">Settings</span>
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full transition-all duration-1000 ${isCouchMode ? 'p-0 overscan-safe min-h-screen justify-center' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 flex flex-col gap-3 md:gap-4'}`}>
        {location.pathname === '/' && !isCouchMode && (
          <section className="w-full flex justify-center">
            <CurrentTurn />
          </section>
        )}

        <div className={`space-y-4 md:space-y-6 ${isCouchMode ? 'mt-0' : ''}`}>
          {children}
        </div>
      </main>

      {/* Exit Couch Mode Escape Hatch (subtle) */}
      {isCouchMode && (
        <Link 
          to="/?exit_couch=true"
          onClick={() => {
            // Force a reload to ensure all states are cleared
            setTimeout(() => window.location.reload(), 100);
          }}
          className="fixed bottom-8 right-8 z-[200] group"
          title="Exit TV Mode"
        >
          <div className="flex items-center gap-0 group-hover:gap-3 px-3 py-3 group-hover:px-6 rounded-full bg-black/20 hover:bg-red-500/80 text-white/20 hover:text-white transition-all duration-500 backdrop-blur-3xl border border-white/5 hover:border-white/20 shadow-2xl overflow-hidden">
            <LogOut size={20} className="group-hover:rotate-12 transition-transform duration-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap overflow-hidden">
              Terminate Session
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}

