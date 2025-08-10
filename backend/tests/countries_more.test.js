const request = require('supertest');
require('./helpers/setupTestEnv');

jest.mock('../src/db', () => ({ query: jest.fn() }));
const pool = require('../src/db');
const app = require('../src/app');

describe('Countries by code and fuels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/countries/:country returns 200 with summary, fuels, recent', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ country: 'US', country_long: 'United States', total_plants: 1, total_capacity: 100, avg_capacity: 100, fuel_types: 1 }] })
      .mockResolvedValueOnce({ rows: [{ primary_fuel: 'Coal', plant_count: 1, total_capacity: 100 }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Plant A', capacity_mw: 100, primary_fuel: 'Coal', commissioning_year: 2019 }] });

    const res = await request(app)
      .get('/api/countries/US')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ summary: expect.any(Object), fuelBreakdown: expect.any(Array), recentPlants: expect.any(Array) })
      })
    );
  });

  test('GET /api/countries/:country returns 404 when no rows', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/countries/ZZ')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(404);
  });

  test('GET /api/countries/:country/fuels returns breakdown', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ primary_fuel: 'Gas', plant_count: 2, total_capacity: 150, avg_capacity: 75 }] });
    const res = await request(app)
      .get('/api/countries/US/fuels')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
  });
});


