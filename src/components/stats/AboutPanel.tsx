import React, { useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

const CHANGELOG = [
  {
    version: 'v0.8',
    date: '2026-03-07',
    items: [
      'Smart Pick weighted randomizer and bulk list actions',
      'Recommendation modes and extended parental controls',
      'PWA install/offline/update status bar'
    ]
  },
  {
    version: 'v0.7',
    date: '2026-03-01',
    items: ['Refresh-all poster metadata now supports force refresh and better matching']
  },
  {
    version: 'v0.5',
    date: '2026-02-10',
    items: ['Added Magic Suggestions AI feature', 'Advanced Family Stats Dashboard']
  }
];

export function AboutPanel() {
  const { theme } = useTheme();
  const [showChangelog, setShowChangelog] = useState(false);
  const latestVersion = CHANGELOG[0].version;

  const unreadCount = useMemo(() => {
    const seen = localStorage.getItem('lastSeenChangelogVersion');
    if (!seen || seen !== latestVersion) return 1;
    return 0;
  }, [latestVersion]);

  const openChangelog = () => {
    localStorage.setItem('lastSeenChangelogVersion', latestVersion);
    setShowChangelog(true);
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            About
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>

        <div className="bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black uppercase tracking-widest text-theme-text">App Version</h3>
            <p className="text-xs text-theme-muted font-mono uppercase tracking-widest mt-1">Current Build: {latestVersion}</p>
          </div>
          <button onClick={openChangelog} className="relative px-6 py-3 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform shadow-lg uppercase text-[10px] tracking-widest">
            View Changelog Feed
            {unreadCount > 0 && <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px]">NEW</span>}
          </button>
        </div>
      </section>

      <div className="text-center py-4 opacity-30 border-t border-theme-border/10">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-theme-muted">Family Movie Night {latestVersion}</p>
      </div>

      <AnimatePresence>
        {showChangelog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangelog(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg rounded-[2rem] border-2 border-theme-primary p-8 shadow-2xl overflow-hidden relative bg-theme-surface" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-theme-primary">Changelog Feed</h2>
                <button onClick={() => setShowChangelog(false)} className="p-2 hover:bg-theme-base rounded-full transition-colors text-theme-muted hover:text-theme-text">✕</button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {CHANGELOG.map(entry => (
                  <div key={entry.version} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-theme-border/30 pb-2">
                      <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">{entry.version}</h3>
                      <span className="text-[10px] font-mono text-theme-muted">{entry.date}</span>
                    </div>
                    <ul className="space-y-2 text-xs font-mono text-theme-text">
                      {entry.items.map((item, idx) => <li key={idx}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
