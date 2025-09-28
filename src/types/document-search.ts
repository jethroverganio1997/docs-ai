
export type HighlightedText = {
  type: "text";
  content: string;
  styles?: {
    highlight?: boolean;
  };
};

export type SortedResult = {
  id: string;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  contentWithHighlights?: HighlightedText[];
};

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
  setSearch: (v: string) => void;
  query: {
    isLoading: boolean;
    data?: SortedResult[] | "empty";
    error?: Error;
  };
}
