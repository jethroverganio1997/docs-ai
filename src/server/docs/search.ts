import { queryRows } from "@/server/db";

export type SearchResultRow = {
  id: number;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  contentWithHighlights: string;
  rank: number;
};

type MatchDocumentEmbeddingRow = {
  content: string;
  url: string;
  similarity: number;
};

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function searchDocuments(searchTerm: string) {
  return await queryRows<SearchResultRow>(
    `
      select
        id,
        url,
        type,
        content,
        "contentWithHighlights",
        rank
      from search_documents($1)
    `,
    [searchTerm],
  );
}

export async function matchDocumentEmbeddings(
  embedding: number[],
  options: {
    matchCount?: number;
    matchThreshold?: number;
  } = {},
) {
  const matchCount = options.matchCount ?? 5;
  const matchThreshold = options.matchThreshold ?? 0.4;

  return await queryRows<MatchDocumentEmbeddingRow>(
    `
      select
        content,
        url,
        similarity
      from match_document_embeddings(
        $1::vector(768),
        $2::double precision,
        $3::integer
      )
    `,
    [toVectorLiteral(embedding), matchThreshold, matchCount],
  );
}
