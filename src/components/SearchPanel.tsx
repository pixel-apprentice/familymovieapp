import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AddMovieModal } from './AddMovieModal';

import { useSearch } from './search/useSearch';
import { SearchForms } from './search/SearchForms';
import { SearchResults } from './search/SearchResults';

export function SearchPanel() {
  const { theme } = useTheme();

  const {
    query,
    setQuery,
    results,
    setResults,
    loading,
    loadingMessage,
    selectedMovie,
    setSelectedMovie,
    handleSearch,
    handleRecommend,
    handleAdd,
    handleMovieAdded,
    handleQuickAdd
  } = useSearch();

  return (
    <div className={`w-full max-w-4xl mx-auto p-8 bg-theme-surface rounded-[2.5rem] border-2 border-theme-border shadow-2xl relative overflow-hidden ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
      } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
      }`}>
      {theme === 'neon-cyberpunk' && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-theme-primary animate-pulse" />
          <div className="absolute bottom-0 right-0 w-1 h-full bg-theme-primary opacity-20" />
        </>
      )}

      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h2 className={`text-2xl md:text-3xl font-black text-theme-primary uppercase tracking-tighter ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            {theme === 'neon-cyberpunk' ? 'Acquisition Protocol' :
              theme === 'mooooovies' ? 'Graze for Movies' :
                theme === 'drive-in' ? 'Tune In to Movies' :
                  theme === 'blockbuster' ? 'Browse the Aisles' :
                    theme === 'sci-fi-hologram' ? 'Scan Database' :
                      theme === 'golden-age' ? 'Search the Studio' :
                        'Find Movies'}
          </h2>
        </div>

        <SearchForms
          query={query}
          setQuery={setQuery}
          loading={loading}
          handleSearch={handleSearch}
          handleRecommend={handleRecommend}
        />

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-[10px] font-mono text-theme-primary animate-pulse uppercase tracking-[0.5em] text-center px-4">{loadingMessage}</span>
            <div className="w-12 h-12 border-4 border-theme-border border-t-theme-primary rounded-full animate-spin" />
          </div>
        )}

        <SearchResults
          results={results}
          setResults={setResults}
          handleAdd={handleAdd}
          handleQuickAdd={handleQuickAdd}
        />
      </div>

      {selectedMovie && (
        <AddMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAdded={handleMovieAdded}
        />
      )}
    </div>
  );
}

