import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateText } from "ai";

import {
  createJsonResponse,
  createMethodNotAllowedResponse,
  createOptionsResponse,
  getRequestMethod,
} from "../shared/http";
import { getDbPool } from "../shared/db";
import { getSecretString } from "../shared/secrets";

type ChatMessagePart = {
  type: string;
  text?: string;
};

type ChatMessage = {
  role: string;
  parts?: ChatMessagePart[];
};

const ALLOWED_METHODS = "POST,OPTIONS";

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

async function getOpenAI() {
  const secret = await getOpenAISecret();

  return createOpenAICompatible({
    name: "openai",
    apiKey: secret.openaiKey,
    baseURL: "https://api.openai.com/v1",
  });
}

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function handler(event: {
  body?: string;
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

  if (getRequestMethod(event) !== "POST") {
    return createMethodNotAllowedResponse(ALLOWED_METHODS);
  }

  let payload: {
    messages?: ChatMessage[];
  } = {};

  try {
    payload = JSON.parse(event.body ?? "{}") as {
      messages?: ChatMessage[];
    };
  } catch {
    return createJsonResponse(
      400,
      { error: "Invalid JSON body." },
      ALLOWED_METHODS,
    );
  }

  const messages = payload.messages ?? [];

  if (messages.length === 0) {
    return createJsonResponse(
      400,
      { error: "No messages provided." },
      ALLOWED_METHODS,
    );
  }

  const latestQuestion = (messages[messages.length - 1]?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join(" ")
    .trim();

  if (!latestQuestion) {
    return createJsonResponse(
      400,
      { error: "The latest message does not contain any text." },
      ALLOWED_METHODS,
    );
  }

  try {
    const db = await getDbPool();
    const openai = await getOpenAI();

    const { embedding } = await embed({
      model: openai.embeddingModel("text-embedding-3-small"),
      value: latestQuestion,
      providerOptions: {
        openai: {
          dimensions: 768,
        },
      },
    });

    const { rows } = await db.query<{
      content: string;
      url: string;
      similarity: number;
    }>(
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
      [toVectorLiteral(embedding), 0.4, 5],
    );

    const context = rows.map((row) => row.content).join("\n\n");
    const sources = [...new Set(rows.map((row) => row.url))];

    const answer = await generateText({
      model: openai("gpt-5.4-mini"),
      system: `
You are a documentation assistant for a public knowledge base.

Rules:
- Answer only from the provided documentation context.
- If the answer is not in the context, say: "Sorry, I don't know how to help with that."
- Keep the answer concise and factual.

Context:
${context || "No matching documentation snippets were found."}
    `.trim(),
      prompt: latestQuestion,
    });

    return createJsonResponse(
      200,
      {
        answer: answer.text,
        sources,
      },
      ALLOWED_METHODS,
    );
  } catch (error) {
    console.error("Chat Lambda failed", error);
    return createJsonResponse(
      500,
      { error: "Failed to generate an answer." },
      ALLOWED_METHODS,
    );
  }
}
