
import { getDbPool } from "../shared/db";
import {
  createJsonResponse,
  createMethodNotAllowedResponse,
  createOptionsResponse,
  getRequestMethod,
} from "../shared/http";

const ALLOWED_METHODS = "GET,OPTIONS";

export async function handler(event: {
  queryStringParameters?: Record<string, string | undefined>;
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
}) {
  if (getRequestMethod(event) === "OPTIONS") {
    return createOptionsResponse(ALLOWED_METHODS);
  }

  if (getRequestMethod(event) !== "GET") {
    return createMethodNotAllowedResponse(ALLOWED_METHODS);
  }

  const query = event.queryStringParameters?.query?.trim();

  if (!query) {
    return createJsonResponse(
      400,
      { error: 'Query parameter "query" is required.' },
      ALLOWED_METHODS,
    );
  }

  try {
     const db = await getDbPool();
    const { rows } = await db.query(
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
      [query],
    );

    return createJsonResponse(200, rows, ALLOWED_METHODS);
  } catch (error) {
    console.error("Search Lambda failed", error);
    return createJsonResponse(
      500,
      { error: "Failed to search documents." },
      ALLOWED_METHODS,
    );
  }
}
