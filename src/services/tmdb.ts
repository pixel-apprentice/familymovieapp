const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  genre_ids?: number[];
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

const dummyMovies: TMDBMovie[] = [
  { id: 1, title: "Space Adventure", poster_path: null, release_date: "2024-01-01", overview: "A fun space movie." },
  { id: 2, title: "Funny Robots", poster_path: null, release_date: "2023-05-12", overview: "Robots being funny." },
  { id: 3, title: "Magic Kingdom", poster_path: null, release_date: "2025-11-20", overview: "Magic everywhere." }
];

export async function searchMovies(query: string, year?: string): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) {
    console.warn("No TMDB API key found, returning dummy data.");
    let results = dummyMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    if (year) {
      results = results.filter(m => m.release_date.startsWith(year));
    }
    return results;
  }

  try {
    let url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    if (year) {
      url += `&primary_release_year=${year}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("TMDB search error:", error);
    return dummyMovies;
  }
}

export async function getMovieDetails(id: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) {
    return dummyMovies.find(m => m.id === id) || null;
  }

  try {
    const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
    return await response.json();
  } catch (error) {
    console.error("TMDB details error:", error);
    return null;
  }
}

