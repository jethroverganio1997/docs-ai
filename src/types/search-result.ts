export type SearchResult = {
  id: number;
  url: string;
  type: 'page' | 'heading' | 'text';
  content: string;
  contentWithHighlights: string; // This key MUST match the SQL return column
  rank: number;
};