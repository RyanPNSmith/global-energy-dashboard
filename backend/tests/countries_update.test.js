const request = require('supertest');
require('./helpers/setupTestEnv');

const app = require('../src/app');

jest.mock('../src/db', () => ({ query: jest.fn() }));
const pool = require('../src/db');

describe('Countries update-data API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects negative capacity', async () => {
    const res = await request(app)
      .post('/api/countries/update-data')
      .set('X-API-Key', process.env.API_KEY)
      .send({ countryName: 'Testland', capacity_mw: -5 });
    expect(res.status).toBe(400);
  });

  test('validates generation against capacity', async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ base_capacity: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/countries/update-data')
      .set('X-API-Key', process.env.API_KEY)
      .send({ countryName: 'Testland', generation_gwh: { '2019': 100 } });
    expect(res.status).toBe(422);
    expect(res.body).toEqual(expect.objectContaining({ success: false }));
  });

  test('upserts when inputs are valid', async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ base_capacity: 10 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/countries/update-data')
      .set('X-API-Key', process.env.API_KEY)
      .send({ countryName: 'Testland', capacity_mw: 12.5, generation_gwh: { '2019': 10 } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
  });
});


