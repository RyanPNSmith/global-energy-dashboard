const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'global_power_plants',
  password: 'MaddieSable2003!',
  port: 5432,
});

// GET /api/countries - Get all countries with power plant data
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        country,
        country_long,
        COUNT(*) as plant_count,
        SUM(capacity_mw) as total_capacity,
        AVG(capacity_mw) as avg_capacity
      FROM gppd.power_plants
      GROUP BY country, country_long
      ORDER BY total_capacity DESC NULLS LAST
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch countries' 
    });
  }
});

// GET /api/countries/:country - Get detailed info for a specific country
router.get('/:country', async (req, res) => {
  try {
    const { country } = req.params;
    
    // Get country summary
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

    // Get fuel breakdown
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

    // Get recent plants (commissioned in last 10 years)
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

// GET /api/countries/:country/fuels - Get fuel breakdown for a country
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

// GET /api/countries/stats/top - Get top countries by capacity
router.get('/stats/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        country,
        country_long,
        COUNT(*) as plant_count,
        SUM(capacity_mw) as total_capacity,
        AVG(capacity_mw) as avg_capacity
      FROM gppd.power_plants
      WHERE capacity_mw IS NOT NULL
      GROUP BY country, country_long
      ORDER BY total_capacity DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching top countries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top countries' 
    });
  }
});

module.exports = router;