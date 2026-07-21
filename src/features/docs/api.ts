import type { PageTree } from "fumadocs-core/server";

type DocsApiError = {
  error?: string;
};

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

export async function getPageTree(): Promise<PageTree.Root> {
  const response = await fetch("/api/docs/tree", {
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
