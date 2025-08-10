// Bulk import for GPPD CSV using PostgreSQL COPY via streaming. Truncates the
// target table first to guarantee a clean load.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const copy = require('pg-copy-streams').from;
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

const csvFilePath = path.resolve(__dirname, '..', 'seeds', 'global_power_plant_database_clean.csv');

async function importData() {
  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('TRUNCATE gppd.power_plants RESTART IDENTITY;');

    console.log('Importing CSV data via COPY...');
    const copyStream = client.query(copy(`
      COPY gppd.power_plants (
        country, country_long, name, gppd_idnr, capacity_mw, latitude, longitude,
        primary_fuel, other_fuel1, other_fuel2, other_fuel3, commissioning_year, owner, source, url,
        geolocation_source, wepp_id, year_of_capacity_data,
        generation_gwh_2013, generation_gwh_2014, generation_gwh_2015, generation_gwh_2016,
        generation_gwh_2017, generation_gwh_2018, generation_gwh_2019,
        generation_data_source,
        estimated_generation_gwh_2013, estimated_generation_gwh_2014, estimated_generation_gwh_2015,
        estimated_generation_gwh_2016, estimated_generation_gwh_2017,
        estimated_generation_note_2013, estimated_generation_note_2014, estimated_generation_note_2015,
        estimated_generation_note_2016, estimated_generation_note_2017
      ) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')
    `));

    await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(csvFilePath);
      fileStream.on('error', reject);
      copyStream.on('error', reject);
      copyStream.on('finish', resolve);
      fileStream.pipe(copyStream);
    });

    console.log('Successfully inserted data.');
  } catch (err) {
    console.error('Error importing CSV:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

importData().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});