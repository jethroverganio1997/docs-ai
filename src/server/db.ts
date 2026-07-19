import { Pool, type QueryResultRow } from "pg";

declare global {
  var __docsDbPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return new Pool({
    connectionString,
    max: 10,
  });
}

export function getDbPool() {
  globalThis.__docsDbPool ??= createPool();
  return globalThis.__docsDbPool;
}

export async function queryRows<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await getDbPool().query<T>(text, values);
  return result.rows;
}
