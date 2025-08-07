const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/power-plants - Get all power plants with optional filtering
router.get('/', async (req, res) => {
  try {
    const { country, fuel, limit = 2000, offset = 0, bounds } = req.query;
    
    // Simple query with basic filtering
    let query = `
      SELECT gppd_idnr, name, country, country_long, 
             ROUND(capacity_mw::numeric, 0) as capacity_mw,
             ROUND(latitude::numeric, 4) as latitude, 
             ROUND(longitude::numeric, 4) as longitude, 
             primary_fuel, commissioning_year, owner
      FROM gppd.power_plants 
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL 
      AND capacity_mw > 0
      AND latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    `;
    const params = [];
    let paramCount = 0;

    // Add bounds filtering if provided
    if (bounds) {
      const [west, south, east, north] = bounds.split(',').map(Number);
      if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
        paramCount++;
        query += ` AND longitude >= $${paramCount}`;
        params.push(west);
        
        paramCount++;
        query += ` AND longitude <= $${paramCount}`;
        params.push(east);
        
        paramCount++;
        query += ` AND latitude >= $${paramCount}`;
        params.push(south);
        
        paramCount++;
        query += ` AND latitude <= $${paramCount}`;
        params.push(north);
      }
    }

    // Add filters if provided
    if (country) {
      paramCount++;
      query += ` AND country = $${paramCount}`;
      params.push(country);
    }
    
    if (fuel) {
      paramCount++;
      query += ` AND primary_fuel = $${paramCount}`;
      params.push(fuel);
    }

    // Add ordering and pagination
    query += ` ORDER BY capacity_mw DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: result.rows.length, // In a real app, you'd get total count separately
      bounds: bounds || null
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

module.exports = router; 