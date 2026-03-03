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

const dummyMovies: TMDBMovie[] = [
  { id: 1, title: "Space Adventure", poster_path: null, release_date: "2024-01-01", overview: "A fun space movie." },
  { id: 2, title: "Funny Robots", poster_path: null, release_date: "2023-05-12", overview: "Robots being funny." },
  { id: 3, title: "Magic Kingdom", poster_path: null, release_date: "2025-11-20", overview: "Magic everywhere." }
];

export async function searchMovies(query: string, year?: string): Promise<TMDBMovie[]> {
  try {
    let url = `/api/tmdb/search?query=${encodeURIComponent(query)}`;
    if (year) {
      url += `&year=${year}`;
    }
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn("Backend TMDB search failed, returning dummy data.");
      return dummyMovies;
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("TMDB search error:", error);
    return dummyMovies;
  }
}

export async function getMovieDetails(id: number): Promise<TMDBMovie | null> {
  try {
    const response = await fetch(`/api/tmdb/details/${id}`);
    if (!response.ok) {
        console.warn("Backend TMDB details failed.");
        return dummyMovies.find(m => m.id === id) || null;
    }
    return await response.json();
  } catch (error) {
    console.error("TMDB details error:", error);
    return null;
  }
}

