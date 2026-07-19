import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { type SortedResult } from "fumadocs-core/search";
import { DOCS_SEARCH_TAG } from "../constants";
import {
  type UseDocsSearchOptions,
  type UseDocsSearchResult,
} from "../types";

export function useDocsSearch(
  options: UseDocsSearchOptions,
): UseDocsSearchResult {
  const {
    api = "/api/search",
    delayMs = 500,
    allowEmpty = false,
  } = options;

  const [search, setSearch] = useState("");
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
    queryKey: [DOCS_SEARCH_TAG, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("query", debouncedSearch.trim());

      const response = await fetch(`${api}?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json() as Promise<SortedResult[] | "empty">;
    },
    enabled: allowEmpty || !!debouncedSearch.trim(),
    staleTime: 5 * 60 * 1000,
  });

  const stableSetSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return {
    search,
    setSearch: stableSetSearch,
    query: {
      isLoading: queryInfo.isLoading,
      data: queryInfo.data,
      error: queryInfo.error as Error | undefined,
    },
  };
}
