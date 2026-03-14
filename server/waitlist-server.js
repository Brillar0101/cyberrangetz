require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { initDB } = require('./db');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://www.cyberrangetz.com',
  'https://cyberrangetz.com',
  'https://cyberrange-frontend.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-admin-secret', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/waitlist', waitlistRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET === 'change-this-to-a-strong-secret') {
  console.warn('[security] WARNING: ADMIN_SECRET is not set or is using the default value.');
}

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`CyberRange TZ waitlist server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
