const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/power-plants - Get all power plants with optional filtering
router.get('/', async (req, res) => {
  try {
    const { country, fuel, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM gppd.power_plants';
    const params = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    const conditions = [];
    
    if (country) {
      paramCount++;
      conditions.push(`country = $${paramCount}`);
      params.push(country);
    }
    
    if (fuel) {
      paramCount++;
      conditions.push(`primary_fuel = $${paramCount}`);
      params.push(fuel);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: result.rows.length // TODO: Add count query for total
    });
  } catch (error) {
    console.error('Error fetching power plants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch power plants',
      details: error.message
    });
  }
});

// GET /api/power-plants/:id - Get a specific power plant by GPPD ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM gppd.power_plants WHERE gppd_idnr = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Power plant not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching power plant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch power plant' 
    });
  }
});

// GET /api/power-plants/country/:country - Get power plants by country
router.get('/country/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM gppd.power_plants 
       WHERE country = $1 
       ORDER BY name 
       LIMIT $2 OFFSET $3`,
      [country, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching power plants by country:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch power plants by country' 
    });
  }
});

// GET /api/power-plants/stats/summary - Get summary statistics
router.get('/stats/summary', async (req, res) => {
  try {
          const result = await pool.query(`
      SELECT 
        COUNT(*) as total_plants,
        COUNT(DISTINCT country) as total_countries,
        COUNT(DISTINCT primary_fuel) as fuel_types,
        AVG(capacity_mw) as avg_capacity,
        SUM(capacity_mw) as total_capacity
      FROM gppd.power_plants
      WHERE capacity_mw IS NOT NULL
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch summary statistics' 
    });
  }
});

module.exports = router; 