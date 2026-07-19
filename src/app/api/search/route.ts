import { NextRequest, NextResponse } from "next/server";
import type { SortedResult } from "fumadocs-core/search";
import { parseHighlights } from "@/features/search/highlight-parser";
import { searchDocuments, type SearchResultRow } from "@/server/docs/search";

function toSortedResult(item: SearchResultRow): SortedResult {
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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "query" is required.' },
      { status: 400 },
    );
  }

  try {
    const rows = await searchDocuments(query);

    if (rows.length === 0) {
      return NextResponse.json("empty");
    }

    return NextResponse.json(rows.map(toSortedResult));
  } catch (error) {
    console.error("Search API failed", error);
    return NextResponse.json(
      { error: "Failed to search documents." },
      { status: 500 },
    );
  }
}
