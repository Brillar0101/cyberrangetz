const express = require('express');
const request = require('supertest');

// Mock rate limiter to be a passthrough in tests
jest.mock('express-rate-limit', () => {
  return () => (req, res, next) => next();
});

// Mock the database pool
jest.mock('../db', () => {
  const mockQuery = jest.fn();
  return {
    pool: { query: mockQuery },
    initDB: jest.fn(),
  };
});

// Mock email service
jest.mock('../services/email', () => ({
  sendWaitlistConfirmation: jest.fn().mockResolvedValue(),
}));

const { pool } = require('../db');
const { sendWaitlistConfirmation } = require('../services/email');
const waitlistRoutes = require('../routes/waitlist');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/waitlist', waitlistRoutes);
  return app;
}

describe('POST /api/waitlist', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  // ── Input Validation (RED → these should pass if validation is correct) ──

  test('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ firstName: 'John', lastName: 'Doe', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('rejects missing firstName', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ lastName: 'Doe', email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/first name/i);
  });

  test('rejects missing lastName', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ firstName: 'John', email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last name/i);
  });

  test('rejects empty firstName (whitespace only)', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ firstName: '   ', lastName: 'Doe', email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/first name/i);
  });

  // ── Successful Signup ──

  test('creates new signup and returns referral code', async () => {
    pool.query
      // INSERT returning new row
      .mockResolvedValueOnce({
        rows: [{ id: 1, referral_code: 'abc123def456' }],
      })
      // COUNT query
      .mockResolvedValueOnce({ rows: [{ count: '42' }] });

    const res = await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.referralCode).toBeDefined();
    expect(res.body.count).toBe(42);
    expect(res.body.referrals).toBe(0);
  });

  test('sends confirmation email on successful signup', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, referral_code: 'abc123def456' }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

    expect(sendWaitlistConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jane',
        email: 'jane@example.com',
        referralCode: 'abc123def456',
      })
    );
  });

  test('returns existing referral code for duplicate email', async () => {
    // INSERT returns empty (ON CONFLICT DO NOTHING)
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      // SELECT existing
      .mockResolvedValueOnce({
        rows: [{ referral_code: 'existing123', referrals: '3' }],
      })
      // COUNT
      .mockResolvedValueOnce({ rows: [{ count: '50' }] });

    const res = await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.already).toBe(true);
    expect(res.body.referralCode).toBe('existing123');
    expect(res.body.referrals).toBe(3);
  });

  test('credits referrer when ref code is provided', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, referral_code: 'newcode456' }],
      })
      // UPDATE referrer count
      .mockResolvedValueOnce({ rows: [] })
      // COUNT
      .mockResolvedValueOnce({ rows: [{ count: '10' }] });

    await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        ref: 'referrercode1',
      });

    // Verify the UPDATE query was called to credit the referrer
    const updateCall = pool.query.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('UPDATE waitlist SET referral_count')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[1]).toEqual(['referrercode1']);
  });

  test('truncates oversized referral code input', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, referral_code: 'abc123' }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '5' }] });

    const longRef = 'a'.repeat(100);
    await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'Bob',
        lastName: 'Test',
        email: 'bob@example.com',
        ref: longRef,
      });

    // The INSERT query's 5th param (safeRef) should be truncated to 20 chars
    const insertCall = pool.query.mock.calls[0];
    expect(insertCall[1][4]).toBe(longRef.slice(0, 20));
  });

  test('normalizes email to lowercase', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, referral_code: 'code123' }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'TEST@EXAMPLE.COM',
      });

    const insertCall = pool.query.mock.calls[0];
    expect(insertCall[1][2]).toBe('test@example.com');
  });

  test('trims whitespace from names', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, referral_code: 'code123' }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await request(app)
      .post('/api/waitlist')
      .send({
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: 'john@example.com',
      });

    const insertCall = pool.query.mock.calls[0];
    expect(insertCall[1][0]).toBe('John');
    expect(insertCall[1][1]).toBe('Doe');
  });

  test('returns 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app)
      .post('/api/waitlist')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server error');
    // Should NOT leak internal error message
    expect(res.body.error).not.toContain('DB connection lost');
  });
});

describe('GET /api/waitlist/count', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  test('returns waitlist count', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ count: '73' }] });

    const res = await request(app).get('/api/waitlist/count');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(73);
  });

  test('returns 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/waitlist/count');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server error');
  });
});

describe('GET /api/waitlist/admin', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    process.env.ADMIN_SECRET = 'test-admin-secret-12345';
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET;
  });

  test('rejects request without admin secret', async () => {
    const res = await request(app).get('/api/waitlist/admin');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('rejects request with wrong admin secret', async () => {
    const res = await request(app)
      .get('/api/waitlist/admin')
      .set('x-admin-secret', 'wrong-secret');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('returns waitlist data with correct secret', async () => {
    const mockEntries = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        referral_code: 'abc123',
        referral_count: 2,
        created_at: '2025-01-01T00:00:00Z',
        referred_by_email: null,
        position: 1,
      },
    ];

    pool.query
      .mockResolvedValueOnce({ rows: mockEntries })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app)
      .get('/api/waitlist/admin')
      .set('x-admin-secret', 'test-admin-secret-12345');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].email).toBe('john@example.com');
  });

  test('returns 500 on database error without leaking details', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app)
      .get('/api/waitlist/admin')
      .set('x-admin-secret', 'test-admin-secret-12345');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server error');
    expect(res.body.error).not.toContain('Connection');
  });
});
