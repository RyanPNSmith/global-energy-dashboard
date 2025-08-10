const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { country, fuel, limit = 2000, offset = 0, bounds } = req.query;

    const params = [];
    let paramCount = 0;
    
    let whereClauses = `
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL 
      AND capacity_mw > 0
      AND latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    `;

    if (bounds) {
      const [west, south, east, north] = bounds.split(',').map(Number);
      if (
        Number.isFinite(west) &&
        Number.isFinite(south) &&
        Number.isFinite(east) &&
        Number.isFinite(north)
      ) {
        if (west <= east) {
          whereClauses += ` AND latitude >= $${paramCount + 1} AND latitude <= $${paramCount + 2}`;
          whereClauses += ` AND longitude >= $${paramCount + 3} AND longitude <= $${paramCount + 4}`;
          params.push(south, north, west, east);
          paramCount += 4;
        } else {
          whereClauses += ` AND latitude >= $${paramCount + 1} AND latitude <= $${paramCount + 2}`;
          whereClauses += ` AND (longitude >= $${paramCount + 3} OR longitude <= $${paramCount + 4})`;
          params.push(south, north, west, east);
          paramCount += 4;
        }
      }
    }

    if (country) {
      paramCount++;
      whereClauses += ` AND country = $${paramCount}`;
      params.push(country);
    }
    
    if (fuel) {
      paramCount++;
      whereClauses += ` AND primary_fuel = $${paramCount}`;
      params.push(fuel);
    }

    const countQuery = `SELECT COUNT(*) FROM gppd.power_plants ${whereClauses}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    const dataQuery = `
      SELECT gppd_idnr, name, country, country_long, 
             ROUND(capacity_mw::numeric, 0) as capacity_mw,
             ROUND(latitude::numeric, 4) as latitude, 
             ROUND(longitude::numeric, 4) as longitude, 
             primary_fuel, commissioning_year, owner
      FROM gppd.power_plants 
      ${whereClauses}
      ORDER BY capacity_mw DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(dataQuery, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total,
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


