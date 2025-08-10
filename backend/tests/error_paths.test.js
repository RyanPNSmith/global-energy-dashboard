const request = require('supertest');
require('./helpers/setupTestEnv');

jest.mock('../src/db', () => ({ query: jest.fn() }));
const pool = require('../src/db');
const app = require('../src/app');

describe('Error paths handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('DB error on /api/global/fuel-capacity returns 500 with success:false', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .get('/api/global/fuel-capacity')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ success: false }));
  });

  test('DB error on /api/power-plants returns 500 with success:false', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .get('/api/power-plants')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ success: false }));
  });
});


