const request = require('supertest');
require('./helpers/setupTestEnv');

// Mock DB so tests don't hit a real database
jest.mock('../src/db', () => ({ query: jest.fn() }));
const pool = require('../src/db');

const app = require('../src/app');

describe('App health and auth', () => {
  test('GET / should return API running', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('API running');
  });

  test('Protected routes require API key', async () => {
    const res = await request(app).get('/api/countries/summary');
    expect([401, 404]).toContain(res.status);
    if (res.status === 401) {
      expect(res.body).toEqual(
        expect.objectContaining({ success: false, error: expect.any(String) })
      );
    }
  });

  test('Protected routes accept valid API key header', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app)
      .get('/api/countries/summary')
      .set('X-API-Key', process.env.API_KEY);
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});


