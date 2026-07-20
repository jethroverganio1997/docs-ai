import { PageTree } from "fumadocs-core/server";
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

const DOCS_TREE_API_ENV = "NEXT_PUBLIC_DOCS_TREE_API_URL";
const DOCS_PAGE_API_ENV = "NEXT_PUBLIC_DOCS_PAGE_API_URL";

function getRequiredApiUrl(envName: string) {
  const apiUrl = process.env[envName]?.trim();

  if (!apiUrl) {
    throw new Error(`${envName} is not configured.`);
  }

  return apiUrl;
}

function buildDocsPageApiUrl(slug: string) {
   const baseUrl = getRequiredApiUrl(DOCS_PAGE_API_ENV);

  return `${baseUrl}/${slug}`;
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => null) as DocsApiError | null;

  if (payload?.error) {
    return payload.error;
  }

  return `Request failed with status ${response.status}.`;
}

function isPageTreeRoot(payload: unknown): payload is PageTree.Root {
  return !!payload &&
    typeof payload === "object" &&
    "children" in payload &&
    Array.isArray((payload as { children?: unknown }).children);
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

export async function getPageTree(): Promise<PageTree.Root> {
  const response = await fetch(getRequiredApiUrl(DOCS_TREE_API_ENV), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = await response.json();

  if (!isPageTreeRoot(payload)) {
    throw new Error("Unexpected docs tree response.");
  }

  return payload;
}

export async function getPage(
  slugs: string[],
): Promise<DocsPageResponse | null> {
  if (slugs.length === 0) {
    return null;
  }

  const response = await fetch(
    buildDocsPageApiUrl(slugs.join("/")),
    {
      next: {
        revalidate: 60 * 60,
      },
    },
  );

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
