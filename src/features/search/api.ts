import type { SortedResult } from "fumadocs-core/search";
import { parseHighlights } from "./highlight-parser";

export type SearchResultRow = {
  id: number;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  contentWithHighlights: string;
  rank: number;
};

export type ChatRequestMessage = {
  role: "user" | "assistant";
  parts: Array<{
    type: "text";
    text: string;
  }>;
};

export type ChatApiResponse = {
  answer?: string;
  sources?: string[];
  error?: string;
};

function isSearchResultRow(value: unknown): value is SearchResultRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.url === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.contentWithHighlights === "string"
  );
}

function isSortedResult(value: unknown): value is SortedResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.content === "string" &&
    Array.isArray(candidate.breadcrumbs) &&
    Array.isArray(candidate.contentWithHighlights)
  );
}

export function getDocsSearchApiUrl() {
  return "/api/docs/search";
}

export function getDocsChatApiUrl() {
  return "/api/docs/chat";
}

export function toSortedResult(item: SearchResultRow): SortedResult {
  return {
    id: item.id.toString(),
    url: item.url,
    type: item.type,
    content: item.content,
    breadcrumbs: item.url
      .split("/")
      .slice(2)
      .map((part, index, parts) =>
        index === parts.length - 1 && part.includes("#")
          ? part.split("#")[0]
          : part,
      ),
    contentWithHighlights: parseHighlights(item.contentWithHighlights),
  };
}

export function normalizeSearchResponse(
  payload: unknown,
): SortedResult[] | "empty" {
  if (payload === "empty") {
    return "empty";
  }

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected search API response.");
  }

  if (payload.length === 0) {
    return "empty";
  }

  if (payload.every(isSearchResultRow)) {
    return payload.map(toSortedResult);
  }

  if (payload.every(isSortedResult)) {
    return payload;
  }

  throw new Error("Unexpected search API response.");
}
