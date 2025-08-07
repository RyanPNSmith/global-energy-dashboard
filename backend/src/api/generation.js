const express = require('express');
const router = express.Router();
const pool = require('../db');

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

    res.json(data);
  } catch (err) {
    console.error('Error fetching generation data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch generation data' });
  }
});

module.exports = router;