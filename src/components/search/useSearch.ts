import React, { useState, useEffect } from 'react';
import { searchMovies, TMDBMovie } from '../../services/tmdb';
import { getVibeSearchTerms, getFamilyRecommendations } from '../../services/gemini';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

// Build a Set of already-watched movie identifiers for de-duplication
function buildWatchedSets(movies: ReturnType<typeof useData>['movies']): {
  watchedTmdbIds: Set<string>;
  watchedTitles: Set<string>;
} {
  const watchedTmdbIds = new Set<string>(
    movies
      .filter(m => m.status === 'watched' && m.tmdbId)
      .map(m => m.tmdbId!.toString())
  );
  const watchedTitles = new Set<string>(
    movies
      .filter(m => m.status === 'watched')
      .map(m => m.title.toLowerCase().trim())
  );
  return { watchedTmdbIds, watchedTitles };
}

function dedupeResults(
  results: TMDBMovie[],
  watchedTmdbIds: Set<string>,
  watchedTitles: Set<string>
): TMDBMovie[] {
  return results.filter(
    m =>
      !watchedTmdbIds.has(m.id.toString()) &&
      !watchedTitles.has((m.title || '').toLowerCase().trim())
  );
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const { currentTurnIndex, movies, profiles } = useData();
  const { allowRatedR } = useSettings();

  // Rotating loading messages
  useEffect(() => {
    if (!loading) return;
    const messages = [
      'Analyzing family favorites...',
      'Consulting the movie critics...',
      'Popping the popcorn...',
      'Finding hidden gems...',
      'Checking the archives...',
      'Almost there...'
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Direct Search ──────────────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await searchMovies(query.trim(), undefined, allowRatedR);
      const { watchedTmdbIds, watchedTitles } = buildWatchedSets(movies);
      const filtered = dedupeResults(res, watchedTmdbIds, watchedTitles);

      if (filtered.length === 0 && res.length > 0) {
        toast.info("All results have already been watched!");
      } else if (filtered.length === 0) {
        toast.info(`No results found for "${query}"`);
      } else {
        setResults(filtered);
      }
    } catch (error: any) {
      console.error('Direct search error:', error);
      toast.error(`Search failed: ${error.message || 'Unable to connect to movie database'}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Vibe Search ────────────────────────────────────────────────────────────
  const handleVibeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const titles = await getVibeSearchTerms(vibe.trim(), allowRatedR);

      if (!titles.length) {
        toast.info('No movies matched that vibe — try a different description');
        return;
      }

      // Use allSettled so one failed lookup doesn't kill all results
      const settled = await Promise.allSettled(
        titles.map(title => searchMovies(title, undefined, allowRatedR))
      );

      const { watchedTmdbIds, watchedTitles } = buildWatchedSets(movies);
      const found: TMDBMovie[] = [];
      let failCount = 0;

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          found.push(result.value[0]);
        } else {
          failCount++;
        }
      }

      const filtered = dedupeResults(found, watchedTmdbIds, watchedTitles);

      if (failCount > 0 && failCount < titles.length) {
        toast.warning(`${failCount} suggestion${failCount > 1 ? 's' : ''} couldn't be found, showing the rest`);
      } else if (failCount === titles.length) {
        toast.error('Vibe search worked but none of the suggestions could be looked up. Check your connection.');
        return;
      }

      if (filtered.length === 0) {
        toast.info("All vibe suggestions have already been watched — try a new vibe!");
      } else {
        setResults(filtered);
      }
    } catch (error: any) {
      console.error('Vibe search error:', error);
      toast.error(`Vibe search failed: ${error.message || 'Could not reach the AI service'}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Surprise Me / Recommendations ─────────────────────────────────────────
  const handleRecommend = async () => {
    setLoading(true);
    setResults([]);
    try {
      const currentUser = profiles[currentTurnIndex]?.id || 'Family';
      const profileNames = profiles.map(p => p.name);
      const history = movies.filter(m => m.status === 'watched');

      if (history.length === 0) {
        toast.info("Add some watched movies first — we need your history to make recommendations!");
        return;
      }

      const recommendations = await getFamilyRecommendations(
        history,
        currentUser,
        profileNames,
        allowRatedR
      );

      if (!recommendations.length) {
        toast.info('No recommendations returned — try again in a moment');
        return;
      }

      // allSettled so individual TMDB lookups don't cascade-fail
      const settled = await Promise.allSettled(
        recommendations.map(rec => searchMovies(rec.title, undefined, allowRatedR).then(res => {
          if (res[0]) { res[0].reason = rec.reason; }
          return res[0] ?? null;
        }))
      );

      const { watchedTmdbIds, watchedTitles } = buildWatchedSets(movies);
      const found: TMDBMovie[] = [];
      let failCount = 0;

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) {
          found.push(result.value);
        } else {
          failCount++;
        }
      }

      const filtered = dedupeResults(found, watchedTmdbIds, watchedTitles);

      if (failCount > 0 && failCount < recommendations.length) {
        toast.warning(`${failCount} recommendation${failCount > 1 ? 's' : ''} couldn't be found on TMDB`);
      }

      if (filtered.length === 0) {
        toast.info(`All recommendations have already been watched! It's picking ${currentUser}'s favorites 😄`);
      } else {
        setResults(filtered);
        toast.success(`${filtered.length} recommendations for ${currentUser}!`);
      }
    } catch (error: any) {
      console.error('Recommend error:', error);
      toast.error(`Recommendation failed: ${error.message || 'Could not reach the AI service'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (movie: TMDBMovie) => setSelectedMovie(movie);

  const handleMovieAdded = () => {
    if (selectedMovie) {
      setResults(prev => prev.filter(r => r.id !== selectedMovie.id));
      setSelectedMovie(null);
    }
  };

  return {
    query, setQuery,
    vibe, setVibe,
    results, setResults,
    loading, loadingMessage,
    selectedMovie, setSelectedMovie,
    handleSearch,
    handleVibeSearch,
    handleRecommend,
    handleAdd,
    handleMovieAdded
  };
}