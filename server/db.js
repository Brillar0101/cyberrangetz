const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
  `);
  console.log('Database tables initialized');
}

module.exports = { pool, initDB };
