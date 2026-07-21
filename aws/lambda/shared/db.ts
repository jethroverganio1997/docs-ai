import { Pool } from "pg";
import { getSecretString } from "./secrets";

let pool: Pool | null = null;

type DatabaseSecret = {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
};

function parseDatabaseSecret(value: string): DatabaseSecret {
  let payload: unknown;

  try {
    payload = JSON.parse(value);
  } catch {
    throw new Error("Database secret must be valid JSON.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Database secret must be an object.");
  }

  const candidate = payload as Record<string, unknown>;
  const port = Number(candidate.port);

  if (
    typeof candidate.host !== "string" ||
    !candidate.host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    typeof candidate.username !== "string" ||
    typeof candidate.password !== "string" ||
    typeof candidate.dbname !== "string"
  ) {
    throw new Error("Database secret is missing required connection fields.");
  }

  return {
    host: candidate.host,
    port,
    username: candidate.username,
    password: candidate.password,
    dbname: candidate.dbname,
  };
}

async function getDatabaseSecret() {
  const secretId = process.env.DATABASE_SECRET_ID?.trim() || "personal-db-secret";
  return parseDatabaseSecret(await getSecretString(secretId));
}

export async function getDbPool() {
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

  return pool;
}
