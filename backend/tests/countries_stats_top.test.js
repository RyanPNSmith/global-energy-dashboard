const request = require('supertest');
require('./helpers/setupTestEnv');

jest.mock('../src/db', () => ({ query: jest.fn() }));
const pool = require('../src/db');
const app = require('../src/app');

describe('Countries stats top', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /api/countries/stats/top respects limit', async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ country: 'US', country_long: 'United States', plant_count: 1, total_capacity: 100, avg_capacity: 100 }], rowCount: 1 });

    const res = await request(app)
      .get('/api/countries/stats/top?limit=1')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });
});


