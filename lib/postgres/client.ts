import { Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __healthlogPostgresPool__: Pool | undefined;
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required when REPOSITORY_DRIVER=postgres.`,
    );
  }

  return value;
}

function parseBooleanEnv(name: string, defaultValue: boolean) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

function parseNumberEnv(name: string, defaultValue: number) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value <= 0) {
    return defaultValue;
  }

  return Math.floor(value);
}

function createPoolConfig(): PoolConfig {
  const connectionString = readRequiredEnv("DATABASE_URL");
  const useSsl = parseBooleanEnv("DATABASE_SSL", true);

  return {
    connectionString,
    max: parseNumberEnv("DATABASE_POOL_MAX", 5),
    idleTimeoutMillis: parseNumberEnv("DATABASE_IDLE_TIMEOUT_MS", 10000),
    allowExitOnIdle: true,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export function getPostgresPool() {
  const existingPool = globalThis.__healthlogPostgresPool__;

  if (existingPool) {
    return existingPool;
  }

  const pool = new Pool(createPoolConfig());
  globalThis.__healthlogPostgresPool__ = pool;

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  const client = await getPostgresPool().connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
