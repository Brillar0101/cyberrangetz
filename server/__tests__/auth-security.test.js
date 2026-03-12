const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../db', () => {
  const mockQuery = jest.fn();
  return { pool: { query: mockQuery }, initDB: jest.fn() };
});

const { pool } = require('../db');
const authRoutes = require('../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Auth Security', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  // ── HIGH-5: Server-side password validation ──

  test('rejects password shorter than 8 characters on register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',  // 5 chars — should fail
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test('accepts password of 8+ characters on register', async () => {
    // Mock: no existing user, successful insert
    pool.query
      .mockResolvedValueOnce({ rows: [] })                      // SELECT check
      .mockResolvedValueOnce({                                    // INSERT
        rows: [{ id: 1, name: 'Test', email: 'test@example.com', university: null }],
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'securepass123',  // 13 chars — should pass
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  // ── HIGH-1: Rate limiting on auth routes ──

  test('login route has rate limiting middleware', () => {
    // This test verifies the rate limiter exists by checking the route stack
    const loginLayer = app._router.stack
      .find(layer => layer.name === 'router')
      ?.handle?.stack
      ?.find(layer =>
        layer.route?.path === '/login' && layer.route?.methods?.post
      );

    // The route should exist
    expect(loginLayer).toBeDefined();
    // It should have more than 1 handler (route handler + rate limiter)
    expect(loginLayer.route.stack.length).toBeGreaterThan(1);
  });

  test('register route has rate limiting middleware', () => {
    const registerLayer = app._router.stack
      .find(layer => layer.name === 'router')
      ?.handle?.stack
      ?.find(layer =>
        layer.route?.path === '/register' && layer.route?.methods?.post
      );

    expect(registerLayer).toBeDefined();
    expect(registerLayer.route.stack.length).toBeGreaterThan(1);
  });
});
