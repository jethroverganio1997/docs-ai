import "server-only";

import { fetchDocsApi } from "@/lib/docs-api";
import { type Frontmatter } from "./types";

type DocsApiError = {
  error?: string;
};

export type DocsPageResponse = {
  frontmatter: Frontmatter;
  content: string;
  directPath: string;
  url: string;
};

async function readError(response: Response) {
  const payload = await response.json().catch(() => null) as DocsApiError | null;

  if (payload?.error) {
    return payload.error;
  }

  return `Request failed with status ${response.status}.`;
}

function isDocsPageResponse(payload: unknown): payload is DocsPageResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.content === "string" &&
    typeof candidate.directPath === "string" &&
    typeof candidate.url === "string" &&
    !!candidate.frontmatter &&
    typeof candidate.frontmatter === "object"
  );
}

export async function getPage(
  slugs: string[],
): Promise<DocsPageResponse | null> {
  if (slugs.length === 0) {
    return null;
  }

  const slug = slugs.map(encodeURIComponent).join("/");
  const response = await fetchDocsApi(`docs/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = await response.json();

  if (!isDocsPageResponse(payload)) {
    throw new Error("Unexpected docs page response.");
  }

  return payload;
}
