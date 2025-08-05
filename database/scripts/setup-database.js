const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection to default postgres database to create our database
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // Connect to default database first
  password: 'MaddieSable2003!', // replace with your actual password
  port: 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database...');
    
    // Create database if it doesn't exist
    console.log('Creating database global_power_plants...');
    await client.query('CREATE DATABASE global_power_plants');
    console.log('✅ Database created successfully');
    
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists, continuing...');
    } else {
      console.error('❌ Error creating database:', err);
      return;
    }
  } finally {
    client.release();
  }
  
  // Now connect to the new database and create tables
  const dbPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'global_power_plants',
    password: 'MaddieSable2003!', // replace with your actual password
    port: 5432,
  });
  
  const dbClient = await dbPool.connect();
  
  try {
    console.log('Creating gppd schema...');
    await dbClient.query('CREATE SCHEMA IF NOT EXISTS gppd;');
    console.log('✅ GPPD schema created successfully');
    
    console.log('Creating power_plants table in gppd schema...');
    
    // Read and execute the schema file, but modify it to use gppd schema
    const schemaPath = path.join(__dirname, '..', 'schema', 'power_plants.sql');
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace CREATE TABLE to use gppd schema
    schemaSQL = schemaSQL.replace(/CREATE TABLE IF NOT EXISTS power_plants/g, 'CREATE TABLE IF NOT EXISTS gppd.power_plants');
    schemaSQL = schemaSQL.replace(/CREATE INDEX IF NOT EXISTS idx_power_plants_/g, 'CREATE INDEX IF NOT EXISTS gppd.idx_power_plants_');
    
    await dbClient.query(schemaSQL);
    console.log('✅ Table schema created successfully in gppd schema');
    
  } catch (err) {
    console.error('❌ Error creating table schema:', err);
  } finally {
    dbClient.release();
    await dbPool.end();
  }
  
  await pool.end();
  console.log('🎉 Database setup complete!');
}

setupDatabase().catch(console.error); 