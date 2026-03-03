import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isGeminiConfigured, testGeminiConnection } from '../../services/gemini';
import { isTMDBConfigured } from '../../services/tmdb';
import { isEmailConfigured } from '../../services/emailService';
import { toast } from 'sonner';

export function SystemHealthPanel() {
  const { isLocalMode, refreshMetadata } = useData();
  const { theme } = useTheme();
  const [testingGemini, setTestingGemini] = useState(false);
  const [refreshingPosters, setRefreshingPosters] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
          System Health
        </h2>
        <div className="h-px flex-1 bg-theme-border/30" />
      </div>
      <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl space-y-4 ${
        theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
      } ${
        theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
      }`}>
        
        <div className="flex items-center justify-between p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
          <div>
            <p className="text-sm font-black text-theme-text">Gemini AI</p>
            <p className="text-xs text-theme-muted font-mono">{isGeminiConfigured() ? 'Configured' : 'Missing API Key'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xl ${isGeminiConfigured() ? 'text-emerald-500' : 'text-red-500'}`}>
              {isGeminiConfigured() ? '●' : '○'}
            </span>
            {isGeminiConfigured() && (
              <button
                onClick={async () => {
                  setTestingGemini(true);
                  try {
                    const result = await testGeminiConnection();
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  } catch (e) {
                    toast.error("Gemini test failed unexpectedly.");
                  } finally {
                    setTestingGemini(false);
                  }
                }}
                disabled={testingGemini}
                className="px-3 py-1 bg-theme-primary/10 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-theme-primary/20 transition-colors disabled:opacity-50"
              >
                {testingGemini ? 'Testing...' : 'Test'}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
          <div>
            <p className="text-sm font-black text-theme-text">TMDB (Movies)</p>
            <p className="text-xs text-theme-muted font-mono">{isTMDBConfigured() ? 'Configured' : 'Missing API Key'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xl ${isTMDBConfigured() ? 'text-emerald-500' : 'text-red-500'}`}>
              {isTMDBConfigured() ? '●' : '○'}
            </span>
            {isTMDBConfigured() && (
              <button
                onClick={async () => {
                  setRefreshingPosters(true);
                  try {
                    await refreshMetadata();
                  } finally {
                    setRefreshingPosters(false);
                  }
                }}
                disabled={refreshingPosters}
                className="px-3 py-1 bg-theme-primary/10 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-theme-primary/20 transition-colors disabled:opacity-50"
              >
                {refreshingPosters ? 'Fetching...' : 'Refresh Posters'}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
          <div>
            <p className="text-sm font-black text-theme-text">Email Service</p>
            <p className="text-xs text-theme-muted font-mono">{isEmailConfigured() ? 'Configured' : 'Missing Config'}</p>
          </div>
          <span className={`text-xl ${isEmailConfigured() ? 'text-emerald-500' : 'text-red-500'}`}>
            {isEmailConfigured() ? '●' : '○'}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
          <div>
            <p className="text-sm font-black text-theme-text">Firebase (Sync)</p>
            <p className="text-xs text-theme-muted font-mono">{!isLocalMode ? 'Connected' : 'Local Mode'}</p>
          </div>
          <span className={`text-xl ${!isLocalMode ? 'text-emerald-500' : 'text-amber-500'}`}>
            {!isLocalMode ? '●' : '○'}
          </span>
        </div>

      </div>
    </section>
  );
}
