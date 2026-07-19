import { SortedResult } from "fumadocs-core/search";

export interface FetchOptions {
  api?: string;
  tag?: string | string[];
  locale?: string;
}

export interface UseDocsSearchOptions extends FetchOptions {
  delayMs?: number;
  allowEmpty?: boolean;
}

export interface UseDocsSearchResult {
  search: string;
  setSearch: (value: string) => void;
  query: {
    isLoading: boolean;
    data?: SortedResult[] | "empty";
    error?: Error;
  };
}
