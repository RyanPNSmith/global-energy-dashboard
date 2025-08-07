const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ensure overrides table exists (idempotent)
async function ensureOverridesTable() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS gppd;
    CREATE TABLE IF NOT EXISTS gppd.country_overrides (
      country_long TEXT PRIMARY KEY,
      capacity_mw NUMERIC,
      generation_overrides JSONB,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

router.get('/', async (req, res) => {
  try {
    const { countries } = req.query;
    if (!countries) {
      return res.status(400).json({ success: false, error: 'countries query parameter is required' });
    }
    const countryList = countries.split(',').map(c => c.trim()).filter(Boolean);
    if (countryList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid countries provided' });
    }

    const query = `
      SELECT
        country_long,
        year,
        SUM(generation) AS total_generation
      FROM (
        SELECT
          country_long,
          year,
          COALESCE(
            CASE WHEN year = 2013 THEN generation_gwh_2013 END,
            CASE WHEN year = 2014 THEN generation_gwh_2014 END,
            CASE WHEN year = 2015 THEN generation_gwh_2015 END,
            CASE WHEN year = 2016 THEN generation_gwh_2016 END,
            CASE WHEN year = 2017 THEN generation_gwh_2017 END,
            CASE WHEN year = 2018 THEN generation_gwh_2018 END,
            CASE WHEN year = 2019 THEN generation_gwh_2019 END,
            CASE WHEN year = 2013 THEN estimated_generation_gwh_2013 END,
            CASE WHEN year = 2014 THEN estimated_generation_gwh_2014 END,
            CASE WHEN year = 2015 THEN estimated_generation_gwh_2015 END,
            CASE WHEN year = 2016 THEN estimated_generation_gwh_2016 END,
            CASE WHEN year = 2017 THEN estimated_generation_gwh_2017 END
          ) AS generation
        FROM gppd.power_plants
        CROSS JOIN (SELECT unnest(ARRAY[2013, 2014, 2015, 2016, 2017, 2018, 2019]) AS year) AS years
        WHERE country_long = ANY($1)
      ) AS unpivoted
      GROUP BY country_long, year
      ORDER BY country_long, year;
    `;

    const result = await pool.query(query, [countryList]);

    const data = {};
    countryList.forEach(country => {
      data[country] = {};
      for (let year = 2013; year <= 2019; year++) {
        data[country][year] = null;
      }
    });

    result.rows.forEach(row => {
      const { country_long, year, total_generation } = row;
      if (data[country_long]) {
        data[country_long][year] = total_generation ? Number(total_generation) : null;
      }
    });

    // Merge generation overrides if available
    try {
      await ensureOverridesTable();
      const ovRes = await pool.query(
        `SELECT country_long, generation_overrides FROM gppd.country_overrides WHERE country_long = ANY($1)`,
        [countryList]
      );
      for (const row of ovRes.rows) {
        const countryName = row.country_long;
        const overrides = row.generation_overrides || {};
        if (!data[countryName]) continue;
        for (const [yearStr, value] of Object.entries(overrides)) {
          const year = Number(yearStr);
          const num = Number(value);
          if (Number.isFinite(year) && Number.isFinite(num)) {
            data[countryName][year] = num;
          }
        }
      }
    } catch (e) {
      // If overrides table missing or other error, proceed without overrides
      console.warn('Overrides merge skipped:', e.message);
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching generation data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch generation data' });
  }
});

module.exports = router;