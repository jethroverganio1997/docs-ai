import { Pool } from "pg";

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secrets = new SecretsManagerClient({});

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

let pool: Pool | null = null;

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

export async function handler(event: {
  queryStringParameters?: Record<string, string | undefined>;
}) {
  const query = event.queryStringParameters?.query?.trim();
   const db = await getPool();

  if (!query) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: 'Query parameter "query" is required.' }),
    };
  }

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

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  };
}
