// ============================================================
// Karios Backend — Database Connection Pool (PostgreSQL / Neon)
// ============================================================
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Return DATE columns (e.g. report_date) as plain "YYYY-MM-DD" strings.
// By default pg turns them into JS Dates at local midnight, which shifts the day
// when converted to UTC (on an IST machine "2026-09-24" became "2026-09-23T18:30Z").
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a SQL query using the pool
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.nodeEnv === 'development') {
      console.log(`[DB Query] ${text.trim().substring(0, 60)}... (${duration}ms, ${res.rowCount} rows)`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Error] Query failed: ${text}`);
    console.error(`[DB Error] Details: ${error.message}`);
    throw error;
  }
}

/**
 * Acquire a client from the pool for transactions
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  return await pool.connect();
}
