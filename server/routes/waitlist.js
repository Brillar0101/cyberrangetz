const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { sendWaitlistConfirmation, sendTierUnlockedEmail, sendNewsletter } = require('../services/email');

// ── Rate limiters ────────────────────────────────────────────────────────────

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signups from this IP, please try again later.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

const statsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Referral tier thresholds (fallback if DB query fails) ────────────────────
const TIER_THRESHOLDS = [3, 5, 10];

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

  const safeRef = typeof ref === 'string' ? ref.slice(0, 20) : null;
  const referralCode = crypto.randomBytes(6).toString('hex');
  const cleanEmail = email.toLowerCase().trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock referrer row if ref code provided (prevents double-count race condition)
    let referrerId = null;
    if (safeRef) {
      const { rows: refRows } = await client.query(
        'SELECT id, email FROM waitlist WHERE referral_code = $1 FOR UPDATE',
        [safeRef]
      );
      if (refRows.length > 0 && refRows[0].email !== cleanEmail) {
        referrerId = refRows[0].id;
      }
    }

    // Insert new signup
    const { rows: inserted } = await client.query(
      `INSERT INTO waitlist (first_name, last_name, email, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, referral_code`,
      [firstName.trim(), lastName.trim(), cleanEmail, referralCode, referrerId]
    );

    // If already on waitlist, return their existing code
    if (inserted.length === 0) {
      await client.query('COMMIT');
      const { rows: existing } = await pool.query(
        `SELECT referral_code,
                (SELECT COUNT(*) FROM waitlist WHERE referred_by = w.id) AS referrals
         FROM waitlist w WHERE email = $1`,
        [cleanEmail]
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

    // Credit the referrer (inside the same transaction)
    if (referrerId) {
      const { rows: updated } = await client.query(
        `UPDATE waitlist SET referral_count = referral_count + 1
         WHERE id = $1
         RETURNING referral_count, first_name, email, last_tier_notified`,
        [referrerId]
      );

      // Check if referrer crossed a tier threshold
      if (updated.length > 0) {
        const { referral_count, first_name: refFirstName, email: refEmail, last_tier_notified } = updated[0];
        const newCount = parseInt(referral_count);
        const lastNotified = parseInt(last_tier_notified) || 0;

        // Find the highest tier just crossed
        const crossedTier = TIER_THRESHOLDS
          .filter(t => newCount >= t && t > lastNotified)
          .pop();

        if (crossedTier) {
          await client.query(
            'UPDATE waitlist SET last_tier_notified = $1 WHERE id = $2',
            [crossedTier, referrerId]
          );

          // Send tier email (non-blocking, after commit)
          const tierInfo = { 3: 'Priority Access', 5: 'Early Beta', 10: 'Founding Member' };
          const tierReward = { 3: 'Move up the waitlist', 5: 'First wave of beta invites', 10: 'Permanent badge + free first month' };
          process.nextTick(() => {
            sendTierUnlockedEmail({
              firstName: refFirstName,
              email: refEmail,
              tierName: tierInfo[crossedTier] || `${crossedTier} Referrals`,
              rewardDescription: tierReward[crossedTier] || '',
              referralCount: newCount,
            }).catch(err => console.error('[email] Failed to send tier email:', err));
          });
        }
      }
    }

    await client.query('COMMIT');

    const { rows: countRow } = await pool.query('SELECT COUNT(*) FROM waitlist');
    const position = parseInt(countRow[0].count);

    // Send confirmation email (non-blocking)
    sendWaitlistConfirmation({
      firstName: firstName.trim(),
      email: cleanEmail,
    }).catch(err => console.error('[email] Failed to send confirmation:', err));

    res.json({
      success: true,
      referralCode: inserted[0].referral_code,
      referrals: 0,
      count: position,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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

// GET /api/waitlist/referrals/:code — public referral stats for a given code
router.get('/referrals/:code', statsLimiter, async (req, res) => {
  const code = (req.params.code || '').slice(0, 20);
  if (!code) return res.status(400).json({ error: 'Referral code required' });

  try {
    const { rows } = await pool.query(
      `SELECT w.first_name, w.referral_count,
              (SELECT json_agg(json_build_object(
                'first_name', r.first_name,
                'created_at', r.created_at
              ) ORDER BY r.created_at DESC)
              FROM waitlist r WHERE r.referred_by = w.id) AS referred_users
       FROM waitlist w WHERE w.referral_code = $1`,
      [code]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Referral code not found' });

    const row = rows[0];
    res.json({
      firstName: row.first_name,
      referralCount: parseInt(row.referral_count) || 0,
      referredUsers: row.referred_users || [],
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/waitlist/tiers — public tier list
router.get('/tiers', statsLimiter, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT name, required_referrals, reward_description, badge_emoji FROM referral_tiers ORDER BY required_referrals ASC'
    );
    res.json({ tiers: rows });
  } catch (err) {
    console.error('Tiers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/waitlist/admin/top-referrers — top referrers leaderboard (admin)
router.get('/admin/top-referrers', adminLimiter, async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT w.id, w.first_name, w.last_name, w.email, w.referral_code,
             w.referral_count, w.created_at,
             (SELECT json_agg(json_build_object(
               'id', r.id,
               'first_name', r.first_name,
               'last_name', r.last_name,
               'email', r.email,
               'created_at', r.created_at
             ) ORDER BY r.created_at DESC)
             FROM waitlist r WHERE r.referred_by = w.id) AS referrals
      FROM waitlist w
      WHERE w.referral_count > 0
      ORDER BY w.referral_count DESC
      LIMIT 50
    `);
    res.json({ topReferrers: rows });
  } catch (err) {
    console.error('Top referrers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/waitlist/admin/referral-tree — full referral tree (admin)
router.get('/admin/referral-tree', adminLimiter, async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT w.id, w.first_name, w.last_name, w.email, w.referral_code,
             w.referral_count, w.referred_by, w.created_at,
             ref.email AS referred_by_email, ref.first_name AS referred_by_name
      FROM waitlist w
      LEFT JOIN waitlist ref ON ref.id = w.referred_by
      ORDER BY w.created_at ASC
    `);
    res.json({ tree: rows });
  } catch (err) {
    console.error('Referral tree error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/waitlist/admin/newsletter — send newsletter to all subscribers
router.post('/admin/newsletter', adminLimiter, async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subject, bodyContent } = req.body;
  if (!subject || !bodyContent) {
    return res.status(400).json({ error: 'subject and bodyContent are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT first_name, email FROM waitlist ORDER BY created_at ASC'
    );

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const row of rows) {
      try {
        await sendNewsletter({
          firstName: row.first_name,
          email: row.email,
          subject,
          bodyContent,
        });
        sent++;
        // Small delay to avoid SMTP rate limits
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        failed++;
        errors.push({ email: row.email, error: err.message });
      }
    }

    res.json({ total: rows.length, sent, failed, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/waitlist/admin/export — export subscribers for external tools
router.get('/admin/export', adminLimiter, async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT first_name, last_name, email, created_at
       FROM waitlist ORDER BY created_at ASC`
    );
    res.json({ count: rows.length, subscribers: rows });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
