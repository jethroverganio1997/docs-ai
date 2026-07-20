import { Pool } from "pg";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

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
  return JSON.parse(await getSecretString("personal-db-secret"));
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
