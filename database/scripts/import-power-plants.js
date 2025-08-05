const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');

// DB connection config (update if needed)
const pool = new Pool({
  user: 'postgres',                // your PostgreSQL username
  host: 'localhost',
  database: 'global_power_plants', // your DB name
  password: 'MaddieSable2003!',       // replace with your actual password
  port: 5432,
});

const csvFilePath = path.join(
  __dirname,
  '..',
  'seeds',
  'global_power_plant_database_clean.csv'
);

(async () => {
  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('TRUNCATE TABLE gppd.power_plants RESTART IDENTITY;');

    console.log('Importing CSV data...');
    const rows = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        console.log(`Read ${rows.length} rows. Inserting...`);

        for (const row of rows) {
          // Helper function to convert empty strings to null for numeric fields
          const parseNumeric = (value) => {
            if (value === '' || value === null || value === undefined) {
              return null;
            }
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
          };

          const parseInteger = (value) => {
            if (value === '' || value === null || value === undefined) {
              return null;
            }
            const num = parseInt(value);
            return isNaN(num) ? null : num;
          };

          await client.query(
            `
            INSERT INTO gppd.power_plants (
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
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,
              $8,$9,$10,$11,$12,$13,$14,$15,
              $16,$17,$18,
              $19,$20,$21,$22,
              $23,$24,$25,
              $26,
              $27,$28,$29,
              $30,$31,
              $32,$33,$34,
              $35,$36
            )
            ON CONFLICT (gppd_idnr) DO NOTHING
          `,
            [
              row.country, row.country_long, row.name, row.gppd_idnr, 
              parseNumeric(row.capacity_mw), parseNumeric(row.latitude), parseNumeric(row.longitude),
              row.primary_fuel, row.other_fuel1, row.other_fuel2, row.other_fuel3, 
              parseInteger(row.commissioning_year), row.owner, row.source, row.url,
              row.geolocation_source, row.wepp_id, parseInteger(row.year_of_capacity_data),
              parseNumeric(row.generation_gwh_2013), parseNumeric(row.generation_gwh_2014), 
              parseNumeric(row.generation_gwh_2015), parseNumeric(row.generation_gwh_2016),
              parseNumeric(row.generation_gwh_2017), parseNumeric(row.generation_gwh_2018), 
              parseNumeric(row.generation_gwh_2019),
              row.generation_data_source,
              parseNumeric(row.estimated_generation_gwh_2013), parseNumeric(row.estimated_generation_gwh_2014), 
              parseNumeric(row.estimated_generation_gwh_2015),
              parseNumeric(row.estimated_generation_gwh_2016), parseNumeric(row.estimated_generation_gwh_2017),
              row.estimated_generation_note_2013, row.estimated_generation_note_2014, row.estimated_generation_note_2015,
              row.estimated_generation_note_2016, row.estimated_generation_note_2017
            ]
          );
        }

        console.log(`✅ Successfully inserted ${rows.length} rows.`);
        client.release();
        process.exit(0);
      });
  } catch (err) {
    console.error('❌ Error importing CSV:', err);
    client.release();
    process.exit(1);
  }
})();
