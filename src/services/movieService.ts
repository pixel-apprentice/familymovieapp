import { searchMovies, getMovieDetails, pickBestMovieMatch, GENRE_MAP, TMDBMovie } from './tmdb';
import { sendRequestEmail } from './emailService';
import { logger } from '../utils/logger';
import { getPosterUrl } from '../constants/movies';
import { hapticFeedback } from '../utils/haptics';

export const movieService = {
  async fetchMetadata(title: string, tmdbId?: string) {
    try {
      let bestMatch: TMDBMovie | null = null;

      if (tmdbId && /^\d+$/.test(String(tmdbId))) {
        bestMatch = await getMovieDetails(Number(tmdbId));
      }

      if (!bestMatch) {
        const results = await searchMovies(title, undefined, true);
        bestMatch = pickBestMovieMatch(title, results);
      }

      if (!bestMatch) return null;

      return {
        poster_url: getPosterUrl(bestMatch.poster_path),
        summary: bestMatch.overview,
        trailerKey: bestMatch.trailerKey,
        genres: bestMatch.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean),
        tmdbId: String(bestMatch.id)
      };
    } catch (error) {
      logger.error(`[MovieService] Failed to fetch metadata for ${title}:`, error);
      throw error;
    }
  },

  async requestPlex(title: string) {
    const success = await sendRequestEmail('movie', title, 'Plex request from Family Movie App');
    if (!success) throw new Error('Failed to send the request email.');
    return true;
  },

  calculateNewRating(currentRating: number, star: number) {
    let newRating = star;
    if (currentRating === star) newRating = star - 0.5;
    else if (currentRating === star - 0.5) newRating = 0;
    return newRating;
  }
};
