import { SearchPanel } from '../components/SearchPanel';
import { MovieList } from '../components/MovieList';
import { isCouchModeEnabled } from '../utils/isCouchMode';
import { useLocation } from 'react-router-dom';

export function HomePage() {
  const location = useLocation();
  const isCouchMode = isCouchModeEnabled();

  return (
    <>
      {!isCouchMode && <SearchPanel />}
      <MovieList />
    </>
  );
}
