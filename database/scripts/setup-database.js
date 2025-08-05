const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const DEFAULT_DB = process.env.DB_DEFAULT || 'postgres';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: DEFAULT_DB,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('Setting up database...');
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created successfully`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists, continuing...');
    } else {
      console.error('Error creating database:', err);
      throw err;
    }
  } finally {
    client.release();
  }

  const dbPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
  });

  const dbClient = await dbPool.connect();

  try {
    console.log('Creating gppd schema...');
    await dbClient.query('CREATE SCHEMA IF NOT EXISTS gppd;');
    console.log('GPPD schema created successfully');

    console.log('Creating power_plants table in gppd schema...');
    const schemaPath = path.resolve(__dirname, '..', 'schema', 'power_plants.sql');
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8')
      .replace(/CREATE TABLE IF NOT EXISTS power_plants/g, 'CREATE TABLE IF NOT EXISTS gppd.power_plants')
      .replace(/CREATE INDEX IF NOT EXISTS idx_power_plants_/g, 'CREATE INDEX IF NOT EXISTS gppd.idx_power_plants_');

    await dbClient.query(schemaSQL);
    console.log('Table schema created successfully in gppd schema');
  } catch (err) {
    console.error('Error creating table schema:', err);
    throw err;
  } finally {
    dbClient.release();
    await dbPool.end();
  }

  await pool.end();
  console.log('Database setup complete!');
}

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});