// export type SearchResult = {
//   id: number;
//   url: string;
//   type: 'page' | 'heading' | 'text';
//   content: string;
//   contentWithHighlights: string; // This key MUST match the SQL return column
//   rank: number;
// };

export interface Frontmatter {
    title: string;
    description?: string;
}


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
