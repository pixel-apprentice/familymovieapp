import React, { useState, useEffect } from 'react';
import { searchMovies, TMDBMovie } from '../../services/tmdb';
import { getVibeSearchTerms, getFamilyRecommendations, isGeminiConfigured } from '../../services/gemini';
import { useData } from '../../contexts/DataContext';
import { toast } from 'sonner';
import { handleError } from '../../utils/errorHandler';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const { currentTurnIndex, movies, profiles } = useData();

  useEffect(() => {
    if (!loading) return;

    const messages = [
      "Analyzing family favorites...",
      "Consulting the movie critics...",
      "Popping the popcorn...",
      "Finding hidden gems...",
      "Checking the archives...",
      "Almost there..."
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
    try {
      const res = await searchMovies(query);
      const watchedTmdbIds = new Set(
        movies.filter(m => m.status === 'watched' && m.tmdbId).map(m => m.tmdbId!.toString())
      );
      const watchedTitles = new Set(
        movies.filter(m => m.status === 'watched').map(m => m.title.toLowerCase().trim())
      );
      setResults(res.filter(m =>
        !watchedTmdbIds.has(m.id.toString()) &&
        !watchedTitles.has(m.title.toLowerCase().trim())
      ));
    } catch (error) {
      handleError(error, 'Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  const handleVibeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;

    if (!isGeminiConfigured()) {
      toast.error("Gemini API key is missing. Using offline fallback.");
    }

    setLoading(true);
    try {
      const titles = await getVibeSearchTerms(vibe);
      if (titles.length > 0) {
        const tmdbResults = await Promise.all(
          titles.map(async (title) => {
            const res = await searchMovies(title);
            return res[0]; // Take best match
          })
        );
        const watchedIds = new Set(movies.filter(m => m.status === 'watched').map(m => m.tmdbId?.toString() || m.id.toString()));
        setResults(tmdbResults.filter(Boolean).filter(m => !watchedIds.has(m!.id.toString())) as TMDBMovie[]);
      } else {
        setResults([]);
      }
    } catch (error) {
      handleError(error, 'Failed to perform vibe search');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!isGeminiConfigured()) {
      toast.error("Gemini API key is missing. Using offline fallback.");
    }

    setLoading(true);
    try {
      const currentUser = profiles[currentTurnIndex]?.id || 'Family';
      const profileNames = profiles.map(p => p.name);
      const history = movies.filter(m => m.status === 'watched' && m.ratings);
      const recommendations = await getFamilyRecommendations(history, currentUser, profileNames);

      if (recommendations.length > 0) {
        const tmdbResults = await Promise.all(
          recommendations.map(async (rec) => {
            const res = await searchMovies(rec.title);
            if (res[0]) {
              res[0].reason = rec.reason;
              return res[0];
            }
            return null;
          })
        );
        const watchedIds = new Set(movies.filter(m => m.status === 'watched').map(m => m.tmdbId?.toString() || m.id.toString()));
        setResults(tmdbResults.filter(Boolean).filter(m => !watchedIds.has(m!.id.toString())) as TMDBMovie[]);
      } else {
        setResults([]);
      }
    } catch (error) {
      handleError(error, 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
  };

  const handleMovieAdded = () => {
    if (selectedMovie) {
      setResults(results.filter(r => r.id !== selectedMovie.id));
      setSelectedMovie(null);
    }
  };

  return {
    query,
    setQuery,
    vibe,
    setVibe,
    results,
    setResults,
    loading,
    loadingMessage,
    selectedMovie,
    setSelectedMovie,
    handleSearch,
    handleVibeSearch,
    handleRecommend,
    handleAdd,
    handleMovieAdded
  };
}