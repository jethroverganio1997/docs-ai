import matter from "gray-matter";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { processMarkdown } from "../shared/markdown-parser";
import { structuredMarkdown } from "../shared/markdown-structured-data";
import {
  getSecretString,
} from "../shared/secrets";
import { getDbPool } from "../shared/db";

type EventBridgeS3Event = {
  "detail-type": string;
  detail: {
    bucket: { name: string };
    object: {
      key: string;
      "version-id"?: string;
      sequencer: string;
    };
  };
};

type DocumentEvent = {
  bucketName: string;
  storageKey: string;
  versionId?: string;
  isDeleteEvent: boolean;
};

const s3 = new S3Client({});
const openaiEmbeddingModelId =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const openaiEmbeddingDimensions = 768;

function normalizeDocumentEvent(
  event: EventBridgeS3Event,
): DocumentEvent | null {
  const bucketName = event.detail.bucket.name;
  const storageKey = event.detail.object.key;

  return {
    bucketName,
    storageKey,
    versionId: event.detail.object["version-id"],
    isDeleteEvent: event["detail-type"] === "Object Deleted",
  };
}

async function fetchDocumentText(
  bucketName: string,
  storageKey: string,
  versionId?: string,
) {
  try {
    console.log("Calling S3");

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
        ...(versionId ? { VersionId: versionId } : {}),
      }),
    );

    if (!response.Body) {
      throw new Error(`S3 object '${storageKey}' returned an empty body.`);
    }

    const content = await response.Body?.transformToString();
    console.log("S3 responded");

    return content;
  } catch (err) {
    console.error("GetObject failed:", err);
    throw err;
  }
}

async function getOpenAISecret() {
  const secretId = process.env.OPENAI_SECRET_ID?.trim() || "openai-key";
  const secret = JSON.parse(await getSecretString(secretId)) as {
    openaiKey?: unknown;
  };

  if (typeof secret.openaiKey !== "string" || !secret.openaiKey) {
    throw new Error("OpenAI secret is missing openaiKey.");
  }

  return { openaiKey: secret.openaiKey };
}


async function getEmbedding(content: string, openaiKey: string) {
  try {
    
    const response = await fetch(`https://api.openai.com/v1/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiEmbeddingModelId,
        input: content,
        dimensions: openaiEmbeddingDimensions,
        encoding_format: "float",
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `OpenAI embeddings request failed (${response.status} ${response.statusText}): ${responseText}`,
      );
    }

    const payload = JSON.parse(responseText) as {
      data?: Array<{
        embedding?: number[];
      }>;
    };

    const embedding = payload.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(
        "OpenAI embedding response did not include a float embedding.",
      );
    }

    return embedding;
  } catch (error) {
    console.error("Error invoking OpenAI embeddings:", error);
    throw error;
  }
}

async function removeDocument(storageKey: string) {
  const db = await getDbPool();

  await db.query("delete from documents where storage_key = $1", [storageKey]);
}

async function upsertDocument(
  bucketName: string,
  storageKey: string,
  versionId?: string,
) {
  console.log(
    `Fetching document '${storageKey}' from S3 bucket '${bucketName}'.`,
  );
  const rawContent = await fetchDocumentText(bucketName, storageKey, versionId);

  console.log(`Processing document '${storageKey}'.`);
  const { data, content } = matter(rawContent);
  
  const title = data.title;
  const description = data.description;
  const url = "docs/" + storageKey
              .replace(/^[^/]+\//, "")   // Remove the first folder (e.g. "knowledge/")
              .replace(/\.[^.]+$/, "")   // Remove the last extension (e.g. ".mdx")
              .replace(/\./g, "/");      // Replace all remaining dots with "/"

  console.log("Start database connection");
  const db = await getDbPool();
  const client = await db.connect();
  console.log("Connected to database");
  const secret = await getOpenAISecret();

  try {
    await client.query("begin");

    console.log(`Upserting document '${storageKey}' into database.`);

    const documentResult = await client.query<{
      id: number;
    }>(
      `
        insert into documents (
          name,
          storage_key,
          bucket_name,
          url,
          title,
          description
        )
        values ($1, $2, $3, $4, $5, $6)
        on conflict (storage_key)
        do update set
          name = excluded.name,
          bucket_name = excluded.bucket_name,
          url = excluded.url,
          title = excluded.title,
          description = excluded.description,
          updated_at = now()
        returning id
      `,
      [
        storageKey.split("/").at(-1) ?? storageKey,
        storageKey,
        bucketName,
        url,
        title,
        description,
      ],
    );

    const documentId = documentResult.rows[0]?.id;

    if (!documentId) {
      throw new Error(`Failed to upsert '${storageKey}'.`);
    }

    await client.query("delete from document_sections where document_id = $1", [
      documentId,
    ]);
    await client.query(
      "delete from document_embeddings where document_id = $1",
      [documentId],
    );

    console.log(
      `Processing document '${storageKey}' into sections and embeddings.`,
    );

    const structuredData = structuredMarkdown(content);
    const sections = [
      ...structuredData.headings.map((heading) => ({
        type: "heading",
        content: heading.content,
        anchorId: heading.id,
      })),
      ...structuredData.contents.map((section) => ({
        type: "text",
        content: section.content,
        anchorId: section.heading ?? "",
      })),
    ];

    console.log(
      `Inserting ${sections.length} sections for document '${storageKey}'.`,
    );

    for (const section of sections) {
      await client.query(
        `
          insert into document_sections (document_id, type, content, anchor_id)
          values ($1, $2, $3, $4)
        `,
        [documentId, section.type, section.content, section.anchorId],
      );
    }

    const embeddingChunks = processMarkdown(rawContent).sections;

    console.log(
      `Generating ${embeddingChunks.length} embeddings for document '${storageKey}'.`,
    );

    for (const chunk of embeddingChunks) {
      const embedding = await getEmbedding(chunk.content, secret.openaiKey);

      await client.query(
        `
          insert into document_embeddings (document_id, content, embedding)
          values ($1, $2, $3::vector(${openaiEmbeddingDimensions}))
        `,
        [documentId, chunk.content, `[${embedding.join(",")}]`],
      );
    }

    await client.query("commit");
    console.log(`Document '${storageKey}' processed successfully.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function handler(event: EventBridgeS3Event) {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const documentEvent = normalizeDocumentEvent(event);

  if (!documentEvent) {
    return {
      statusCode: 200,
      body: JSON.stringify({ processed: 0 }),
    };
  }

  const { bucketName, storageKey, versionId, isDeleteEvent } = documentEvent;

  console.log(
    `Document event details:`,
    JSON.stringify(documentEvent, null, 2),
  );

  if (isDeleteEvent) {
    await removeDocument(storageKey);
  } else if (storageKey.endsWith(".mdx")) {
    await upsertDocument(bucketName, storageKey, versionId);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: 1 }),
  };
}
