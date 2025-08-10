const request = require('supertest');
require('./helpers/setupTestEnv');

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const app = require('../src/app');

describe('Countries API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/countries/summary returns list', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/countries/summary')
      .set('X-API-Key', process.env.API_KEY);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ success: true, data: expect.any(Array), count: expect.any(Number) })
    );
  });

  test('GET /api/countries/details requires countryName', async () => {
    const res = await request(app)
      .get('/api/countries/details')
      .set('X-API-Key', process.env.API_KEY);
    expect(res.status).toBe(400);
  });

  test('GET /api/countries/:country/generation uses overrides when present', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { year: 2018, reported_generation_gwh: 10, estimated_generation_gwh: 8 },
          { year: 2019, reported_generation_gwh: null, estimated_generation_gwh: null },
        ],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ generation_overrides: { '2019': 12, '2020': 5 } }] });

    const res = await request(app)
      .get('/api/countries/Testland/generation')
      .set('X-API-Key', process.env.API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const years = res.body.data.map(d => d.year);
    expect(years).toEqual([2018, 2019, 2020]);
    const y2019 = res.body.data.find(d => d.year === 2019);
    expect(y2019.effective_generation_gwh).toBe(12);
  });
});


