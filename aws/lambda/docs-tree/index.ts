import {
  createJsonResponse,
  createOptionsResponse,
  getRequestMethod,
} from "../shared/http";
import {
  formatName,
  getRouteSegments,
  normalizeRouteUrl,
  type PageTreeNode,
  type PageTreeRoot,
  sortTree,
} from "../shared/docs-utils";
import { getDbPool } from "../shared/db";

type DocsTreeEvent = {
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
};

type DocumentPathRecord = {
  url: string;
};

const ALLOWED_METHODS = "GET,OPTIONS";

export async function handler(event: DocsTreeEvent) {
  if (getRequestMethod(event) === "OPTIONS") {
    return createOptionsResponse(ALLOWED_METHODS);
  }

  try {
    const db = await getDbPool();
    const { rows } = await db.query<DocumentPathRecord>(
      `
        select url
        from documents
        order by url asc
      `,
    );

    const root: PageTreeRoot = {
      name: "Docs",
      children: [],
    };

    for (const row of rows) {
      const segments = getRouteSegments(row.url);

      if (segments.length === 0) {
        continue;
      }

      const pageSegment = segments.at(-1)!;
      const dirSegments = segments.slice(0, -1);
      let currentNode: PageTreeRoot | PageTreeNode = root;

      for (const segment of dirSegments) {
        let folderNode: PageTreeNode | undefined = currentNode.children?.find(
          (node) => node.type === "folder" && node.name === formatName(segment),
        );

        if (!folderNode) {
          folderNode = {
            type: "folder",
            name: formatName(segment),
            defaultOpen: currentNode === root,
            children: [],
          };
          currentNode.children?.push(folderNode);
        }

        currentNode = folderNode;
      }

      currentNode.children?.push({
        type: "page",
        name: formatName(pageSegment),
        url: normalizeRouteUrl(row.url),
      });
    }

    sortTree(root);

    return createJsonResponse(200, root, ALLOWED_METHODS);
  } catch (error) {
    console.error("Docs tree Lambda failed", error);
    return createJsonResponse(
      500,
      { error: "Failed to load docs tree." },
      ALLOWED_METHODS,
    );
  }
}
