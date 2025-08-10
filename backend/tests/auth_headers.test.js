const request = require('supertest');
require('./helpers/setupTestEnv');

jest.mock('../src/db', () => ({ query: jest.fn() }));
const app = require('../src/app');

describe('Auth header variations', () => {
  test('Invalid API key returns 401', async () => {
    const res = await request(app)
      .get('/api/countries/summary')
      .set('X-API-Key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  test('Authorization: Bearer works', async () => {
    const res = await request(app)
      .get('/api/countries/summary')
      .set('Authorization', `Bearer ${process.env.API_KEY}`);
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});


