import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateText } from "ai";
import { Pool } from "pg";

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

type ChatMessagePart = {
  type: string;
  text?: string;
};

type ChatMessage = {
  role: string;
  parts?: ChatMessagePart[];
};

const secrets = new SecretsManagerClient({});

let pool: Pool | null = null;

async function getSecretString(secretId: string) {
  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  if (typeof response.SecretString === "string" && response.SecretString) {
    return response.SecretString;
  }

  if (response.SecretBinary) {
    return new TextDecoder().decode(response.SecretBinary);
  }

  throw new Error(`Secret '${secretId}' is empty`);
}

async function getDatabaseSecret() {
  console.log("Fetching database secret from Secrets Manager");
  const secret = JSON.parse(await getSecretString("personal-db-secret"));
  console.log("Database secret fetched from Secrets Manager");

  return secret;
}

async function getOpenAISecret() {
  console.log("Fetching OpenAI secret from Secrets Manager");
  const secret = JSON.parse(await getSecretString("openai-key"));
  console.log("OpenAI secret fetched from Secrets Manager");

  return secret;
}

async function getPool() {
  console.log("Getting database pool");
  if (pool) {
    return pool;
  }

  const secret = await getDatabaseSecret();

  pool = new Pool({
    host: secret.host,
    port: secret.port,
    user: secret.username,
    password: secret.password,
    database: secret.dbname,
    max: 5,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("Database pool created");
  return pool;
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

export async function handler(event: { body?: string }) {
  const payload = JSON.parse(event.body ?? "{}") as {
    messages?: ChatMessage[];
  };
  
  const messages = payload.messages ?? [];
  const db = await getPool();
  const openai = await getOpenAI();

  if (messages.length === 0) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "No messages provided." }),
    };
  }

  const latestQuestion = (messages[messages.length - 1]?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join(" ")
    .trim();

  console.log("Latest question:", latestQuestion);
  const { embedding } = await embed({
    model: openai.embeddingModel("text-embedding-3-small"),
    value: latestQuestion,
    providerOptions: {
      openai: {
        dimensions: 768,
      },
    },
  });

  // console.log("Generated embedding:", embedding);
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

  // console.log("Retrieved matching documents:", rows);
  const context = rows.map((row) => row.content).join("\n\n");
  const sources = [...new Set(rows.map((row) => row.url))];

  // console.log("Context:", context);
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

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answer: answer.text,
      sources,
    }),
  };
}
