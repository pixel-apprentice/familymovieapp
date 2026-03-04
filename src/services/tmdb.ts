export const isTMDBConfigured = () => true; // Handled on backend

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  genre_ids?: number[];
  reason?: string;
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

/**
 * Search TMDB for movies. Throws on failure (no silent dummy fallback).
 * Caller is responsible for catching and showing user-facing errors.
 */
export async function searchMovies(
  query: string,
  year?: string,
  allowRatedR?: boolean
): Promise<TMDBMovie[]> {
  const doSearch = async (q: string): Promise<TMDBMovie[]> => {
    let url = `/api/tmdb/search?query=${encodeURIComponent(q)}`;
    if (year) url += `&year=${year}`;
    if (allowRatedR) url += `&allowR=true`;

    const response = await fetch(url);
    if (!response.ok) {
      let message = `Search failed (${response.status})`;
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch { /* ignore JSON parse failure */ }
      throw new Error(message);
    }
    const data = await response.json();
    return data.results || [];
  };

  // Pass 1: Exact search
  let results = await doSearch(query);

  // Pass 2: Fallbacks if no results
  if (results.length === 0) {
    let fallbackQuery = query.toLowerCase().trim();
    let tryFallback = false;

    // 1. Strip trailing 's' (e.g., "Migrations" -> "Migration")
    if (fallbackQuery.endsWith('s') && fallbackQuery.length > 3) {
      fallbackQuery = fallbackQuery.slice(0, -1);
      tryFallback = true;
    }
    // 2. Strip leading "The " (e.g., "The Jumanji" -> "Jumanji")
    else if (fallbackQuery.startsWith('the ')) {
      fallbackQuery = fallbackQuery.slice(4);
      tryFallback = true;
    }

    if (tryFallback) {
      console.log(`No results for "${query}", falling back to "${fallbackQuery}"...`);
      results = await doSearch(fallbackQuery);
    }
  }

  return results;
}

export async function getMovieDetails(id: number): Promise<TMDBMovie | null> {
  const response = await fetch(`/api/tmdb/details/${id}`);
  if (!response.ok) {
    console.warn(`TMDB details fetch failed for id=${id}: ${response.status}`);
    return null;
  }
  return response.json();
}
