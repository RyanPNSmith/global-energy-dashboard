const { Pool } = require('pg');
const dotenv = require('dotenv');

const path = require('path');
// Load environment variables from project root .env when invoked from compiled sources
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Shared PostgreSQL connection pool for backend queries.
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Gracefully close the pool when the process is terminated
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

module.exports = pool;
