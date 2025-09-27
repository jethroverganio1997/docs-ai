// hooks/useDocsSearch.ts
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { SortedResult, UseDocsSearchOptions, UseDocsSearchResult } from "../types/document-search";


// --- The Hook Implementation ---

export function useDocsSearch(
  options: UseDocsSearchOptions,
): UseDocsSearchResult {
  const {
    api = "/api/search",
    delayMs = 500, // This is now our debounce delay
    allowEmpty = false,
    headers,
  } = options;

  // 1. Live search term for the input field (immediate UI feedback)
  const [search, setSearch] = useState("");

  // 2. Debounced search term that will trigger the actual query
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [search, delayMs]);

  const queryInfo = useQuery({
    // The query key is an array that uniquely identifies this data.
    // When `debouncedSearch` changes, TanStack Query will run the query.
    queryKey: ["docsSearch", debouncedSearch], // Corrected line

    // The function that performs the fetch
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("query", debouncedSearch.trim());

      const response = await fetch(`${api}?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json() as Promise<SortedResult[] | "empty">;
    },

    // The query will only run if the debounced search term and headers are present
    enabled: !!headers && (allowEmpty || !!debouncedSearch.trim()),

    // Cache the data forever
    // staleTime: Infinity,
    staleTime: 5 * 60 * 1000, // 300000 milliseconds
  });

  const stableSetSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return {
    search,
    setSearch: stableSetSearch,
    // 4. Map the result from useQuery to your expected `query` object shape
    query: {
      isLoading: queryInfo.isLoading,
      data: queryInfo.data,
      error: queryInfo.error as Error | undefined,
    },
  };
}
