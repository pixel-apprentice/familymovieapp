import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export function AboutPanel() {
  const { theme } = useTheme();
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            {theme === 'mooooovies' ? 'About the Pasture' :
             theme === 'drive-in' ? 'About the Lot' :
             theme === 'blockbuster' ? 'About the Store' :
             theme === 'sci-fi-hologram' ? 'System Info' :
             theme === 'golden-age' ? 'Production Notes' :
             'About'}
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        
        <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
          theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
        } ${
          theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
        }`}>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black uppercase tracking-widest text-theme-text">
              {theme === 'mooooovies' ? 'Pasture Version' :
               theme === 'drive-in' ? 'Lot Version' :
               theme === 'blockbuster' ? 'Store Version' :
               theme === 'sci-fi-hologram' ? 'System Version' :
               theme === 'golden-age' ? 'Print Version' :
               'App Version'}
            </h3>
            <p className="text-xs text-theme-muted font-mono uppercase tracking-widest mt-1">Current Build: v0.5</p>
          </div>
          <button 
            onClick={() => setShowChangelog(true)}
            className="px-6 py-3 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform shadow-lg uppercase text-[10px] tracking-widest"
          >
            {theme === 'mooooovies' ? 'View Graze Log' :
             theme === 'drive-in' ? 'View Logbook' :
             theme === 'blockbuster' ? 'View Inventory Log' :
             theme === 'sci-fi-hologram' ? 'View System Log' :
             theme === 'golden-age' ? 'View Production Log' :
             'View Changelog'}
          </button>
        </div>
      </section>

      {/* Footer Version */}
      <div className="text-center py-4 opacity-30 border-t border-theme-border/10">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-theme-muted">
          {theme === 'mooooovies' ? 'Family Mooovie Night' :
           theme === 'drive-in' ? 'Drive-In Movie Night' :
           theme === 'blockbuster' ? 'Blockbuster Night' :
           theme === 'sci-fi-hologram' ? 'Holo-Deck Cinema' :
           theme === 'golden-age' ? 'Golden Age Cinema' :
           'Family Movie Night'} v0.5
        </p>
      </div>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChangelog(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-[2rem] border-2 border-theme-primary p-8 shadow-2xl overflow-hidden relative ${
                theme === 'modern-pinnacle' ? 'bg-black/80 backdrop-blur-xl border-white/20' : 'bg-theme-surface'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-theme-primary">
                  {theme === 'mooooovies' ? 'Graze Log' :
                   theme === 'drive-in' ? 'Logbook' :
                   theme === 'blockbuster' ? 'Inventory Log' :
                   theme === 'sci-fi-hologram' ? 'System Log' :
                   theme === 'golden-age' ? 'Production Log' :
                   'Changelog'}
                </h2>
                <button 
                  onClick={() => setShowChangelog(false)} 
                  className="p-2 hover:bg-theme-base rounded-full transition-colors text-theme-muted hover:text-theme-text"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-theme-border/30 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">v0.5 (Current)</h3>
                    <span className="text-[10px] font-mono text-theme-primary bg-theme-primary/10 px-2 py-1 rounded-lg">LATEST</span>
                  </div>
                  <ul className="space-y-3 text-xs font-mono text-theme-text">
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">✨</span>
                      <span>Added "Magic Suggestions" AI feature for personalized picks</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎨</span>
                      <span>New Theme: Neon Cyberpunk</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">📊</span>
                      <span>Advanced Family Stats Dashboard</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🔒</span>
                      <span>Secure Local Mode & Firebase Sync</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 opacity-80">
                  <div className="flex items-center justify-between border-b border-theme-border/30 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">v0.1 - v0.4</h3>
                  </div>
                  <ul className="space-y-3 text-xs font-mono text-theme-text">
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎬</span>
                      <span>Basic Movie Tracking & Wishlist</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">👥</span>
                      <span>Family Member Profiles</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎲</span>
                      <span>Random Movie Picker</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-theme-border/30 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-theme-text/70">Built with ❤️ by Dad for Pizza Movie Night</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
