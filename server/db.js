const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      university VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      lab_id VARCHAR(50) NOT NULL,
      container_id VARCHAR(255),
      ws_session_id VARCHAR(255) UNIQUE,
      started_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS completions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      lab_id VARCHAR(50) NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, lab_id)
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      referral_code VARCHAR(16) UNIQUE NOT NULL DEFAULT '',
      referral_count INTEGER DEFAULT 0,
      referred_by INTEGER REFERENCES waitlist(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS last_tier_notified INTEGER DEFAULT 0;
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP;
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email_bounced_at TIMESTAMP;
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS bounce_reason VARCHAR(255);
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS duplicate_attempts INTEGER DEFAULT 0;
    ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS last_duplicate_at TIMESTAMP;

    CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist(referred_by);
    CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
    CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
    CREATE INDEX IF NOT EXISTS idx_waitlist_email_lower ON waitlist(LOWER(email));

    CREATE TABLE IF NOT EXISTS referral_tiers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      required_referrals INTEGER NOT NULL UNIQUE,
      reward_description TEXT NOT NULL,
      badge_emoji VARCHAR(10),
      created_at TIMESTAMP DEFAULT NOW()
    );

    INSERT INTO referral_tiers (name, required_referrals, reward_description, badge_emoji)
    VALUES
      ('Priority Access', 3, 'Move up the waitlist', '⚡'),
      ('Early Beta', 5, 'First wave of beta invites', '🚀'),
      ('Founding Member', 10, 'Permanent badge + free first month', '⭐')
    ON CONFLICT (required_referrals) DO NOTHING;
  `);

  // Backfill any stale referral_count values
  await pool.query(`
    UPDATE waitlist w
    SET referral_count = sub.actual
    FROM (
      SELECT w2.id, COUNT(r.id) AS actual
      FROM waitlist w2
      LEFT JOIN waitlist r ON r.referred_by = w2.id
      GROUP BY w2.id
    ) sub
    WHERE w.id = sub.id AND w.referral_count != sub.actual
  `);

  console.log('Database tables initialized');
}

module.exports = { pool, initDB };
