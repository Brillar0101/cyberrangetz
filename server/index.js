require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require('ws');
const { initDB } = require('./db');
const { setupWebSocket } = require('./websocket/wsHandler');
const authRoutes = require('./routes/auth');
const labRoutes = require('./routes/labs');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/waitlist', waitlistRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

const PORT = process.env.PORT || 4000;

// Warn if secrets are still set to their insecure defaults
if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET === 'change-this-to-a-strong-secret') {
  console.warn('[security] WARNING: ADMIN_SECRET is not set or is using the default value. Change it before deploying.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cyberrange-jwt-secret-change-in-production') {
  console.warn('[security] WARNING: JWT_SECRET is not set or is using the default value. Change it before deploying.');
}

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`CyberRange TZ server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
