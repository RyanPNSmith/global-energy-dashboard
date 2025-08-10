const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.test') });

process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'postgres';


