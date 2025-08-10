const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/global/fuel-capacity
 * Returns total generating capacity grouped by primary fuel.
 */
router.get('/fuel-capacity', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT primary_fuel AS fuel,
             SUM(capacity_mw) AS capacity_mw
      FROM gppd.power_plants
      WHERE primary_fuel IS NOT NULL AND capacity_mw IS NOT NULL
      GROUP BY primary_fuel
      ORDER BY capacity_mw DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching global fuel capacity:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global fuel capacity'
    });
  }
});

module.exports = router;