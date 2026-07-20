import matter from "gray-matter";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  createJsonResponse,
  createOptionsResponse,
  getRequestMethod,
} from "../shared/http";
import { getDbPool } from "../shared/db";
import { normalizeRouteUrl } from "../shared/docs-utils";

type DocsPageEvent = {
  pathParameters?: Record<string, string | undefined>;
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
};

type DocumentRecord = {
  storage_key: string;
  bucket_name: string | null;
  url: string;
  title: string;
  description: string | null;
};

const ALLOWED_METHODS = "GET,OPTIONS";

const s3 = new S3Client({});

async function fetchDocumentText(bucketName: string, storageKey: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object '${storageKey}' returned an empty body.`);
  }

  return await response.Body.transformToString();
}

export async function handler(event: DocsPageEvent) {
  if (getRequestMethod(event) === "OPTIONS") {
    return createOptionsResponse(ALLOWED_METHODS);
  }

  const slugValue = event.pathParameters?.slug?.trim();
  const slug = slugValue?.replace(/^\/+|\/+$/g, "");

  if (!slug) {
    return createJsonResponse(
      400,
      { error: 'Path parameter "slug" is required.' },
      ALLOWED_METHODS,
    );
  }

  try {
    const db = await getDbPool();
    const lookupUrl = `docs/${slug}`;

    const { rows } = await db.query<DocumentRecord>(
      `
        select
          storage_key,
          bucket_name,
          url,
          title,
          description
        from documents
        where url = $1
        limit 1
      `,
      [lookupUrl],
    );

    const document = rows[0];

    if (!document) {
      return createJsonResponse(
        404,
        { error: "Document not found." },
        ALLOWED_METHODS,
      );
    }

    if (!document.bucket_name) {
      throw new Error(`Document '${lookupUrl}' is missing bucket_name.`);
    }

    const rawContent = await fetchDocumentText(
      document.bucket_name,
      document.storage_key,
    );
    const { data, content } = matter(rawContent);

    return createJsonResponse(
      200,
      {
        frontmatter: {
          title: data.title,
          description: data.description,
        },
        content,
        directPath: `${slug}.mdx`,
        url: normalizeRouteUrl(document.url),
      },
      ALLOWED_METHODS,
    );
  } catch (error) {
    console.error("Docs page Lambda failed", error);
    return createJsonResponse(
      500,
      { error: "Failed to load documentation." },
      ALLOWED_METHODS,
    );
  }
}
