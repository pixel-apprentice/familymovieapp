import { Movie } from '../types/movie';



export const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const POSTER_HD_URL = 'https://image.tmdb.org/t/p/w780';

export const getPosterUrl = (path?: string, hd = false) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${hd ? POSTER_HD_URL : POSTER_BASE_URL}${path}`;
};

export const calculateAverageRating = (ratings: Record<string, number> = {}) => {
  const values = Object.values(ratings).filter((r): r is number => typeof r === 'number' && r > 0);
  if (values.length === 0) return 0;
  return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
};

export const sortMoviesByDate = (a: { date?: string }, b: { date?: string }) => {
  const aDate = a.date === 'Unknown' ? null : a.date;
  const bDate = b.date === 'Unknown' ? null : b.date;
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
};

export const getWatchedMovies = (movies: Movie[]) => {
  return movies.filter(m => m.status === 'watched').sort(sortMoviesByDate);
};
