'use client';

import React from 'react';
import { SearchProviderWrapper } from './search-context';
import SearchModal from './search-modal';

export function SearchProvider({ children }: { children: React.ReactNode }) {
  return (
    <SearchProviderWrapper>
      {children}
      <SearchModal />
    </SearchProviderWrapper>
  );
}

export { useSearch } from './search-context';
