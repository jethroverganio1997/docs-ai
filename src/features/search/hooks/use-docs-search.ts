import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { DOCS_SEARCH_TAG } from "../constants";
import { getDocsSearchApiUrl, normalizeSearchResponse } from "../api";
import {
  type UseDocsSearchOptions,
  type UseDocsSearchResult,
} from "../types";

export function useDocsSearch(
  options: UseDocsSearchOptions,
): UseDocsSearchResult {
  const {
    api,
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

      const response = await fetch(
        `${getDocsSearchApiUrl(api)}?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : `Request failed with status ${response.status}.`;

        throw new Error(errorMessage);
      }

      return normalizeSearchResponse(payload);
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
