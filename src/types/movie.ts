export interface FamilyProfile {
  id: string;
  name: string;
  color: string;
}

export interface Movie {
  id: string;
  tmdbId?: string;
  title: string;
  poster_url?: string;
  trailerKey?: string;
  summary?: string;
  status: 'wishlist' | 'watched';
  pickedBy: string;
  date?: string;
  genres?: string[];
  ratings: Record<string, number>;
}

export interface CouchState {
  path: string;
  movieId?: string;
  viewMode?: 'grid' | 'list';
  pickerFilter?: string;
  genreFilter?: string;
  searchQuery?: string;
  activeTrailer?: string;
  timestamp: number;
}

export interface PulseEvent {
  type: 'rating' | 'watched' | 'added' | 'status';
  userName?: string;
  movieTitle?: string;
  message?: string;
  title?: string;
  value?: string | number;
  timestamp: number;
  onAction?: () => void;
}
