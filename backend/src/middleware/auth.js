const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set');
}

/**
 * Express middleware that validates an API key via constant-time comparison.
 * Accepts either `x-api-key: <key>` or `Authorization: Bearer <key>`.
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Please provide an API key in the x-api-key header or Authorization header'
    });
  }
  
  const cleanApiKey = apiKey.replace('Bearer ', '');
  
  const providedKeyBuffer = Buffer.from(cleanApiKey, 'utf8');
  const actualKeyBuffer = Buffer.from(API_KEY, 'utf8');

  if (providedKeyBuffer.length !== actualKeyBuffer.length || !crypto.timingSafeEqual(providedKeyBuffer, actualKeyBuffer)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

module.exports = validateApiKey; 