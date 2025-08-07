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

router.get('/stats/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Ensure overrides table exists so LEFT JOIN works even if empty
    await ensureOverridesTable();

    // Compute base aggregates per country from plants, then merge capacity overrides
    const result = await pool.query(
      `
      WITH base AS (
        SELECT 
          country,
          country_long,
          COUNT(*) AS plant_count,
          SUM(capacity_mw) AS base_total_capacity,
          AVG(capacity_mw) AS avg_capacity
        FROM gppd.power_plants
        WHERE capacity_mw IS NOT NULL
        GROUP BY country, country_long
      )
      SELECT 
        b.country,
        b.country_long,
        b.plant_count,
        COALESCE(o.capacity_mw, b.base_total_capacity) AS total_capacity,
        b.avg_capacity
      FROM base b
      LEFT JOIN gppd.country_overrides o
        ON o.country_long = b.country_long
      ORDER BY total_capacity DESC
      LIMIT $1
      `,
      [parseInt(limit)]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching top countries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top countries' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        country,
        country_long
      FROM gppd.power_plants
      GROUP BY country, country_long
      ORDER BY country_long
    `);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching countries summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch countries summary' 
    });
  }
});

// GET /api/countries/details?countryName=Country Long Name
router.get('/details', async (req, res) => {
  try {
    const { countryName } = req.query;
    if (!countryName || typeof countryName !== 'string') {
      return res.status(400).json({ success: false, error: 'countryName query parameter is required' });
    }

    // Base capacity from plants
    const baseResult = await pool.query(
      `SELECT COALESCE(SUM(capacity_mw), 0) AS base_capacity FROM gppd.power_plants WHERE country_long = $1`,
      [countryName]
    );
    const baseCapacity = Number(baseResult.rows[0]?.base_capacity || 0);

    await ensureOverridesTable();
    const overrideResult = await pool.query(
      `SELECT capacity_mw FROM gppd.country_overrides WHERE country_long = $1`,
      [countryName]
    );
    const overrideCapacity = overrideResult.rows[0]?.capacity_mw;

    const capacity_mw = overrideCapacity != null ? Number(overrideCapacity) : baseCapacity;

    res.json({ success: true, data: { country_long: countryName, capacity_mw } });
  } catch (error) {
    console.error('Error fetching country capacity details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch country capacity details' });
  }
});

// GET /api/countries/:country/generation
// Returns yearly generation with reported, estimated, and effective (override > reported > estimated)
router.get('/:country/generation', async (req, res) => {
  try {
    const { country } = req.params;
    if (!country) {
      return res.status(400).json({ success: false, error: 'country parameter is required' });
    }

    // Sum reported and estimated by year (2013-2019)
    const query = `
      WITH years AS (
        SELECT unnest(ARRAY[2013,2014,2015,2016,2017,2018,2019]) AS year
      )
      SELECT 
        y.year,
        SUM(
          CASE y.year
            WHEN 2013 THEN p.generation_gwh_2013
            WHEN 2014 THEN p.generation_gwh_2014
            WHEN 2015 THEN p.generation_gwh_2015
            WHEN 2016 THEN p.generation_gwh_2016
            WHEN 2017 THEN p.generation_gwh_2017
            WHEN 2018 THEN p.generation_gwh_2018
            WHEN 2019 THEN p.generation_gwh_2019
          END
        ) AS reported_generation_gwh,
        SUM(
          CASE y.year
            WHEN 2013 THEN p.estimated_generation_gwh_2013
            WHEN 2014 THEN p.estimated_generation_gwh_2014
            WHEN 2015 THEN p.estimated_generation_gwh_2015
            WHEN 2016 THEN p.estimated_generation_gwh_2016
            WHEN 2017 THEN p.estimated_generation_gwh_2017
            WHEN 2018 THEN NULL
            WHEN 2019 THEN NULL
          END
        ) AS estimated_generation_gwh
      FROM years y
      LEFT JOIN gppd.power_plants p
        ON p.country_long = $1
      GROUP BY y.year
      ORDER BY y.year;
    `;

    const base = await pool.query(query, [country]);

    await ensureOverridesTable();
    const overridesRes = await pool.query(
      `SELECT generation_overrides FROM gppd.country_overrides WHERE country_long = $1`,
      [country]
    );
    const overrides = overridesRes.rows[0]?.generation_overrides || {};

    const data = base.rows.map((row) => {
      const year = String(row.year);
      const reported = row.reported_generation_gwh != null ? Number(row.reported_generation_gwh) : null;
      const estimated = row.estimated_generation_gwh != null ? Number(row.estimated_generation_gwh) : null;
      const overrideVal = overrides?.[year] != null ? Number(overrides[year]) : null;
      const effective = overrideVal != null ? overrideVal : (reported != null ? reported : estimated);
      return {
        year: Number(year),
        reported_generation_gwh: reported,
        estimated_generation_gwh: estimated,
        effective_generation_gwh: effective
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching country generation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch country generation' });
  }
});

router.get('/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const summaryResult = await pool.query(`
      SELECT 
        country,
        country_long,
        COUNT(*) as total_plants,
        SUM(capacity_mw) as total_capacity,
        AVG(capacity_mw) as avg_capacity,
        COUNT(DISTINCT primary_fuel) as fuel_types
      FROM gppd.power_plants
      WHERE country = $1
      GROUP BY country, country_long
    `, [country]);

    if (summaryResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Country not found' 
      });
    }

    const fuelResult = await pool.query(`
      SELECT 
        primary_fuel,
        COUNT(*) as plant_count,
        SUM(capacity_mw) as total_capacity
      FROM gppd.power_plants
      WHERE country = $1 AND primary_fuel IS NOT NULL
      GROUP BY primary_fuel
      ORDER BY total_capacity DESC
    `, [country]);

    const recentResult = await pool.query(`
      SELECT 
        name,
        capacity_mw,
        primary_fuel,
        commissioning_year
      FROM gppd.power_plants
      WHERE country = $1 
        AND commissioning_year IS NOT NULL
        AND commissioning_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 10
      ORDER BY commissioning_year DESC
      LIMIT 10
    `, [country]);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        fuelBreakdown: fuelResult.rows,
        recentPlants: recentResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching country details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch country details' 
    });
  }
});

router.get('/:country/fuels', async (req, res) => {
  try {
    const { country } = req.params;
    const result = await pool.query(`
      SELECT 
        primary_fuel,
        COUNT(*) as plant_count,
        SUM(capacity_mw) as total_capacity,
        AVG(capacity_mw) as avg_capacity
      FROM gppd.power_plants
      WHERE country = $1 AND primary_fuel IS NOT NULL
      GROUP BY primary_fuel
      ORDER BY total_capacity DESC
    `, [country]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching country fuels:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch country fuel data' 
    });
  }
});

// POST /api/countries/update-data
// Upserts capacity and generation overrides for a country
router.post('/update-data', async (req, res) => {
  try {
    const { countryName, capacity_mw, generation_gwh } = req.body || {};
    if (!countryName || typeof countryName !== 'string') {
      return res.status(400).json({ success: false, error: 'countryName is required' });
    }

    // Validate inputs
    let capacityValue = null;
    if (capacity_mw !== undefined && capacity_mw !== null && capacity_mw !== '') {
      const num = Number(capacity_mw);
      if (!Number.isFinite(num) || num < 0) {
        return res.status(400).json({ success: false, error: 'capacity_mw must be a non-negative number' });
      }
      // Allow decimals; store as numeric with scale preserved by PG
      capacityValue = num;
    }

    let generationOverrides = null;
    if (generation_gwh && typeof generation_gwh === 'object') {
      generationOverrides = {};
      for (const [year, value] of Object.entries(generation_gwh)) {
        const y = Number(year);
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(y) || y < 1900 || y > currentYear) continue;
        const v = Number(value);
        if (!Number.isFinite(v) || v < 0) continue;
        // Allow decimals for GWh as well
        generationOverrides[y] = v;
      }
    }

    await ensureOverridesTable();

    // Determine effective capacity for validation: prefer incoming override, else stored override, else base sum
    let effectiveCapacityMw = null;
    try {
      if (capacityValue != null) {
        effectiveCapacityMw = Number(capacityValue);
      } else {
        const baseRes = await pool.query(
          `SELECT COALESCE(SUM(capacity_mw), 0) AS base_capacity FROM gppd.power_plants WHERE country_long = $1`,
          [countryName]
        );
        const baseCapacity = Number(baseRes.rows[0]?.base_capacity || 0);
        const ovRes = await pool.query(
          `SELECT capacity_mw FROM gppd.country_overrides WHERE country_long = $1`,
          [countryName]
        );
        const storedOverride = ovRes.rows[0]?.capacity_mw;
        effectiveCapacityMw = storedOverride != null ? Number(storedOverride) : baseCapacity;
      }
    } catch (e) {
      // If validation prefetch fails, continue without validation
      effectiveCapacityMw = null;
    }

    // Validate generation vs capacity theoretical maximum (100% capacity factor)
    if (generationOverrides && effectiveCapacityMw != null && Number.isFinite(effectiveCapacityMw) && effectiveCapacityMw > 0) {
      const maxAnnualGwh = effectiveCapacityMw * 8.76; // MW * 8760 h / 1000 = GWh
      const violatingYears = Object.entries(generationOverrides)
        .filter(([, v]) => Number(v) > maxAnnualGwh)
        .map(([y, v]) => ({ year: Number(y), value_gwh: Number(v), max_allowed_gwh: maxAnnualGwh }));
      if (violatingYears.length > 0) {
        return res.status(422).json({
          success: false,
          error: `One or more yearly generation values exceed the theoretical maximum (${maxAnnualGwh.toFixed(2)} GWh) for capacity ${effectiveCapacityMw} MW`,
          details: { violatingYears }
        });
      }
    }

    // Upsert logic
    await pool.query(
      `
      INSERT INTO gppd.country_overrides (country_long, capacity_mw, generation_overrides)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (country_long) DO UPDATE SET
        capacity_mw = COALESCE(EXCLUDED.capacity_mw, gppd.country_overrides.capacity_mw),
        generation_overrides = CASE 
          WHEN EXCLUDED.generation_overrides IS NULL THEN gppd.country_overrides.generation_overrides
          ELSE COALESCE(gppd.country_overrides.generation_overrides, '{}'::jsonb) || EXCLUDED.generation_overrides
        END,
        updated_at = now();
      `,
      [countryName, capacityValue, generationOverrides ? JSON.stringify(generationOverrides) : null]
    );

    res.json({ success: true, message: 'Country data updated' });
  } catch (error) {
    console.error('Error updating country data:', error);
    res.status(500).json({ success: false, error: 'Failed to update country data' });
  }
});

module.exports = router;