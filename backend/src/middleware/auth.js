require('dotenv').config({ path: '../.env' });
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set');
}

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // Check if API key is provided
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Please provide an API key in the x-api-key header or Authorization header'
    });
  }
  
  // Remove 'Bearer ' prefix if present
  const cleanApiKey = apiKey.replace('Bearer ', '');
  
  // Validate the API key format (16-digit alphanumeric)
  const apiKeyRegex = /^[A-Za-z0-9]{16}$/;
  if (!apiKeyRegex.test(cleanApiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key format',
      message: 'API key must be a 16-digit alphanumeric string'
    });
  }
  
  // Check if API key matches
  if (cleanApiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // API key is valid, proceed to next middleware
  next();
};

module.exports = validateApiKey; 