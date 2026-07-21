import "server-only";

import { unstable_cache } from "next/cache";
import { fetchDocsApi } from "./docs-api";

type CachedDocsTree = {
  body: string;
  contentType: string;
};

export class DocsTreeUpstreamError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    readonly contentType: string,
  ) {
    super(`Docs tree request failed with status ${status}.`);
  }
}

async function fetchDocsTree(): Promise<CachedDocsTree> {
  const response = await fetchDocsApi("docs/tree", {
    cache: "no-store",
  });
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  if (!response.ok) {
    throw new DocsTreeUpstreamError(response.status, body, contentType);
  }

  return { body, contentType };
}

const getCachedDocsTree = unstable_cache(fetchDocsTree, ["docs-tree"], {
  revalidate: 5 * 60,
});

export function getDocsTree() {
  return getCachedDocsTree();
}
