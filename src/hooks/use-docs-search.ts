// hooks/useDocsSearch.ts
import { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---

export type HighlightedText = {
  type: 'text';
  content: string;
  styles?: {
    highlight?: boolean;
  };
};

export type SortedResult = {
  id: string;
  url: string;
  type: 'page' | 'heading' | 'text';
  content: string;
  contentWithHighlights?: HighlightedText[];
};

interface FetchOptions {
  api?: string;
  tag?: string | string[];
  locale?: string;
  /**
   * Optional headers to include in the fetch request.
   */
  headers?: Record<string, string>; // ADDED
}

interface UseDocsSearchOptions extends FetchOptions {
  delayMs?: number;
  allowEmpty?: boolean;
}

interface UseDocsSearchResult {
  search: string;
  setSearch: (v: string) => void;
  query: {
    isLoading: boolean;
    data?: SortedResult[] | 'empty';
    error?: Error;
  };
}

// --- The Hook Implementation ---

export function useDocsSearch(options: UseDocsSearchOptions): UseDocsSearchResult {
  const {
    api = '/api/search',
    delayMs = 200,
    allowEmpty = false,
    headers, // ADDED
  } = options;

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<UseDocsSearchResult['query']>({
    isLoading: false,
    data: undefined,
    error: undefined,
  });

  useEffect(() => {
    if (!allowEmpty && !search.trim()) {
      setQuery({ isLoading: false, data: undefined, error: undefined });
      return;
    }

    setQuery((prev) => ({ ...prev, isLoading: true }));

    const handler = setTimeout(() => {
      const performFetch = async () => {
        try {
          const params = new URLSearchParams();
          params.set('query', search.trim());
          
          // Pass the headers object to the fetch call
          const response = await fetch(`${api}?${params.toString()}`, {
            headers, // ADDED
          });

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const result: SortedResult[] | 'empty' = await response.json();
          setQuery({ isLoading: false, data: result, error: undefined });
        } catch (e) {
          setQuery({ isLoading: false, data: undefined, error: e as Error });
        }
      };

      performFetch();
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
    // Add headers to the dependency array
  }, [search, api, allowEmpty, delayMs, headers]); // MODIFIED
  
  const stableSetSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return { search, setSearch: stableSetSearch, query };
}