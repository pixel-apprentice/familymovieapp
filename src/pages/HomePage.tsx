import React from 'react';
import { SearchPanel } from '../components/SearchPanel';
import { MovieList } from '../components/MovieList';

export function HomePage() {
  return (
    <>
      <SearchPanel />
      <MovieList />
    </>
  );
}
