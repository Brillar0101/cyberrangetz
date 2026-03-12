const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { sendWaitlistConfirmation } = require('../services/email');

// ── Rate limiters ────────────────────────────────────────────────────────────

// Max 5 signups per IP per hour
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signups from this IP, please try again later.' },
});

// Max 10 admin login attempts per IP per 15 minutes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/waitlist — submit email (with optional referral code)
router.post('/', signupLimiter, async (req, res) => {
  const { email, ref, firstName, lastName } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: 'First name required' });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ error: 'Last name required' });
  }

  // Cap referral code input to prevent oversized payloads reaching the DB
  const safeRef = typeof ref === 'string' ? ref.slice(0, 20) : null;

  // 6 bytes = 12 hex chars — enough entropy to prevent brute-force referral fraud
  const referralCode = crypto.randomBytes(6).toString('hex');

  try {
    // Insert new signup
    const { rows: inserted } = await pool.query(
      `INSERT INTO waitlist (first_name, last_name, email, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, (SELECT id FROM waitlist WHERE referral_code = $5))
       ON CONFLICT (email) DO NOTHING
       RETURNING id, referral_code`,
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), referralCode, safeRef]
    );

    // If already on waitlist, return their existing code
    if (inserted.length === 0) {
      const { rows: existing } = await pool.query(
        'SELECT referral_code, (SELECT COUNT(*) FROM waitlist WHERE referred_by = waitlist.id) AS referrals FROM waitlist WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      const { rows: countRow } = await pool.query('SELECT COUNT(*) FROM waitlist');
      return res.json({
        success: true,
        already: true,
        referralCode: existing[0].referral_code,
        referrals: parseInt(existing[0].referrals),
        count: parseInt(countRow[0].count),
      });
    }

    // Credit the referrer
    if (safeRef) {
      await pool.query(
        'UPDATE waitlist SET referral_count = referral_count + 1 WHERE referral_code = $1',
        [safeRef]
      );
    }

    const { rows: countRow } = await pool.query('SELECT COUNT(*) FROM waitlist');
    const position = parseInt(countRow[0].count);

    // Send confirmation email (non-blocking — don't fail the request if it errors)
    sendWaitlistConfirmation({
      firstName: firstName.trim(),
      email: email.toLowerCase().trim(),
      referralCode: inserted[0].referral_code,
      position,
    }).catch(err => console.error('[email] Failed to send confirmation:', err));

    res.json({
      success: true,
      referralCode: inserted[0].referral_code,
      referrals: 0,
      count: position,
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/waitlist/count
router.get('/count', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM waitlist');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/waitlist — protected by ADMIN_SECRET header
router.get('/admin', adminLimiter, async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT
        w.id,
        w.first_name,
        w.last_name,
        w.email,
        w.referral_code,
        w.referral_count,
        w.created_at,
        ref.email AS referred_by_email,
        ROW_NUMBER() OVER (ORDER BY w.created_at ASC) AS position
      FROM waitlist w
      LEFT JOIN waitlist ref ON ref.id = w.referred_by
      ORDER BY w.created_at ASC
    `);
    const { rows: total } = await pool.query('SELECT COUNT(*) FROM waitlist');
    res.json({ count: parseInt(total[0].count), entries: rows });
  } catch (err) {
    console.error('Admin waitlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
