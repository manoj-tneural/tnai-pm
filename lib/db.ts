import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'tnai_user',
  password: process.env.DB_PASSWORD || 'tneural123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tnai_pm',
});

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function getClient() {
  return pool.connect();
}

export default pool;
