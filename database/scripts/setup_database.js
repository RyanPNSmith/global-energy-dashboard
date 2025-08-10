const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
};

/**
 * Creates the database if missing, then creates schema and tables for GPPD.
 */
async function setupDatabase() {
  try {
    console.log(`Checking if database ${dbConfig.database} exists...`);
    // Use psql to list databases and grep for the target name; exits non-zero if not found
    execSync(`psql -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -lqt | cut -d \\| -f 1 | grep -qw ${dbConfig.database}`, {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
      stdio: 'pipe',
    });
    console.log(`Database ${dbConfig.database} already exists.`);
  } catch (error) {
    console.log(`Database ${dbConfig.database} does not exist. Creating...`);
    try {
      // Create the database owned by the configured user
      execSync(`createdb -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -O ${dbConfig.user} ${dbConfig.database}`, {
        env: { ...process.env, PGPASSWORD: dbConfig.password },
        stdio: 'inherit',
      });
      console.log(`Database ${dbConfig.database} created successfully.`);
    } catch (dbError) {
      console.error(`Error creating database: ${dbError}`);
      process.exit(1);
    }
  }

  const pool = new Pool({
    ...dbConfig,
  });

  const client = await pool.connect();

  try {
    console.log('Creating gppd schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS gppd;');
    console.log('GPPD schema created successfully');

    console.log('Creating power_plants table in gppd schema...');
    const schemaPath = path.resolve(__dirname, '..', 'schema', 'power_plants.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSQL);
    console.log('Table schema created successfully in gppd schema');
  } catch (err) {
    console.error('Error creating table schema:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('Database setup complete!');
}

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});