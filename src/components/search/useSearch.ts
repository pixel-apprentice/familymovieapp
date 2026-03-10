import React, { useState, useEffect } from 'react';
import { searchMovies, TMDBMovie, GENRE_MAP } from '../../services/tmdb';
import { getVibeSearchTerms, getFamilyRecommendations } from '../../services/gemini';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { hapticFeedback } from '../../utils/haptics';
import { toast } from 'sonner';

const MATURE_KEYWORDS = ['gore', 'graphic', 'sexual', 'drug', 'abuse', 'torture', 'violence', 'nudity'];

function buildExistingSets(movies: ReturnType<typeof useData>['movies']): {
  existingTmdbIds: Set<string>;
  existingTitles: Set<string>;
} {
  const existingTmdbIds = new Set<string>(
    movies
      .filter(m => m.tmdbId)
      .map(m => m.tmdbId!.toString())
  );
  const existingTitles = new Set<string>(
    movies
      .filter(() => true)
      .map(m => m.title.toLowerCase().trim())
  );
  return { existingTmdbIds, existingTitles };
}

function markExistingResults(
  results: TMDBMovie[],
  existingTmdbIds: Set<string>,
  existingTitles: Set<string>
): TMDBMovie[] {
  return results.map(m => ({
    ...m,
    isExisting: existingTmdbIds.has(m.id.toString()) ||
      existingTitles.has((m.title || '').toLowerCase().trim())
  }));
}

function filterForSafety(results: TMDBMovie[], blockMatureThemes: boolean): TMDBMovie[] {
  if (!blockMatureThemes) return results;
  return results.filter(m => {
    const summary = (m.overview || '').toLowerCase();
    return !MATURE_KEYWORDS.some(k => summary.includes(k));
  });
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const { currentTurnIndex, movies, profiles, addMovie } = useData();
  const { allowRatedR, recommendationMode, blockMatureThemes } = useSettings();

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await searchMovies(query.trim(), undefined, allowRatedR);
      const { existingTmdbIds, existingTitles } = buildExistingSets(movies);
      const marked = markExistingResults(res, existingTmdbIds, existingTitles);
      const filtered = filterForSafety(marked, blockMatureThemes);

      if (filtered.length === 0 && res.length > 0) {
        toast.info('No safe results for that search.');
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

      const settled = await Promise.allSettled(
        titles.map(title => searchMovies(title, undefined, allowRatedR))
      );

      const { existingTmdbIds, existingTitles } = buildExistingSets(movies);
      const found: TMDBMovie[] = [];

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          found.push(result.value[0]);
        }
      }

      const marked = markExistingResults(found, existingTmdbIds, existingTitles);
      const filtered = filterForSafety(marked, blockMatureThemes);

      if (filtered.length === 0) {
        toast.info('All vibe suggestions were filtered.');
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

  const handleRecommend = async () => {
    setLoading(true);
    setResults([]);
    try {
      const currentUser = profiles[currentTurnIndex]?.id || 'Family';
      const profileNames = profiles.map(p => p.name);
      const history = movies.filter(() => true);

      if (history.length === 0) {
        toast.info('Add watched movies first to get recommendations!');
        return;
      }

      const recommendations = await getFamilyRecommendations(
        history,
        currentUser,
        profileNames,
        allowRatedR || recommendationMode !== 'safe'
      );

      toast.info(`Generating personalized picks for ${currentUser}...`);

      const settled = await Promise.allSettled(
        recommendations.map(rec => searchMovies(rec.title, undefined, allowRatedR).then(res => {
          if (res[0]) { res[0].reason = rec.reason; }
          return res[0] ?? null;
        }))
      );

      const { existingTmdbIds, existingTitles } = buildExistingSets(movies);
      let found: TMDBMovie[] = [];

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) found.push(result.value);
      }

      found = markExistingResults(found, existingTmdbIds, existingTitles);
      found = filterForSafety(found, blockMatureThemes || recommendationMode === 'safe');

      if (recommendationMode === 'familiar') {
        found = found.filter(f => (f.reason || '').toLowerCase().includes('like') || (f.reason || '').toLowerCase().includes('similar'));
      }
      if (recommendationMode === 'explore') {
        found = found.filter(f => (f.reason || '').toLowerCase().includes('new') || (f.reason || '').toLowerCase().includes('different'));
      }

      if (found.length === 0) {
        toast.info('No recommendations matched your current mode/preferences.');
      } else {
        setResults(found);
        toast.success(`${found.length} ${recommendationMode} recommendations for ${currentUser}!`);
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

  const handleQuickAdd = async (movie: TMDBMovie) => {
    try {
      hapticFeedback.success();
      const currentUserProfile = profiles[currentTurnIndex]?.id || 'Family';

      const movieToAdd = {
        tmdbId: String(movie.id),
        title: movie.title,
        status: 'wishlist' as const,
        pickedBy: currentUserProfile,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        summary: movie.overview,
        genres: movie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean),
        ratings: {}
      };

      await addMovie(movieToAdd);
      setResults(prev => prev.filter(r => r.id !== movie.id));
      toast.success(`"${movie.title}" added to wishlist!`);
    } catch (e) {
      console.error('Quick add failed:', e);
      toast.error('Failed to add movie quickly.');
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
    handleMovieAdded,
    handleQuickAdd
  };
}
