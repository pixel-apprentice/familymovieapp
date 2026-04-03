import { useEffect } from 'react';
import { SearchPanel } from '../components/SearchPanel';
import { MovieList } from '../components/MovieList';
import { isCouchModeEnabled } from '../utils/isCouchMode';
import { useLocation, useNavigate } from 'react-router-dom';

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isCouchMode = isCouchModeEnabled();

  // Handle PWA shortcut deep links: /?action=random or /?action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (!action) return;

    // Clean the URL immediately
    navigate('/', { replace: true });

    if (action === 'random') {
      // Dispatch a custom event that MovieList's FilterBar can catch
      window.dispatchEvent(new CustomEvent('fmn:shortcut-random'));
    } else if (action === 'add') {
      // Focus the search input
      window.dispatchEvent(new CustomEvent('fmn:shortcut-add'));
    }
  }, [location.search, navigate]);

  return (
    <>
      {!isCouchMode && <SearchPanel />}
      <MovieList />
    </>
  );
}
