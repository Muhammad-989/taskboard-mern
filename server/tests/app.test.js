import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('API foundation', () => {
  it('reports a healthy service', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('requires authentication for boards', async () => {
    const response = await request(app).get('/api/boards');
    expect(response.status).toBe(401);
  });
});
