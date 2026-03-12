const url = require('url');
const jwt = require('jsonwebtoken');
const { getPty, destroyPty } = require('../services/terminalService');
const { stopContainer } = require('../services/dockerService');
const { pool } = require('../db');

// Track active WebSocket connections per session
const activeConnections = new Map();
// Track pending cleanup timers
const cleanupTimers = new Map();

function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    const params = url.parse(req.url, true).query;
    const { sessionId } = params;

    // Auth state — client must send auth message first
    let authenticated = false;
    let session = null;
    let dataHandler = null;

    // Also support legacy query-string token for backwards compatibility
    const queryToken = params.token;
    if (queryToken) {
      try {
        jwt.verify(queryToken, process.env.JWT_SECRET);
        authenticated = true;
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Authentication failed' }));
        ws.close();
        return;
      }
    }

    function attachSession() {
      session = getPty(sessionId);
      if (!session) {
        ws.send(JSON.stringify({ error: 'Session not found' }));
        ws.close();
        return false;
      }

      // Cancel any pending cleanup for this session (handles React StrictMode remount)
      if (cleanupTimers.has(sessionId)) {
        clearTimeout(cleanupTimers.get(sessionId));
        cleanupTimers.delete(sessionId);
        console.log(`Cleanup cancelled for session ${sessionId} (reconnected)`);
      }

      // Close any previous WebSocket for this session
      const prev = activeConnections.get(sessionId);
      if (prev && prev.readyState <= 1) {
        prev._replaced = true;
        prev.close();
      }

      activeConnections.set(sessionId, ws);

      console.log(`WebSocket connected for session ${sessionId}`);

      // Send PTY output to WebSocket
      dataHandler = session.pty.onData((data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
        }
      });

      return true;
    }

    // If already authenticated via query param, attach immediately
    if (authenticated) {
      if (!attachSession()) return;
    }

    // Receive input from WebSocket
    ws.on('message', (message) => {
      const msg = message.toString();

      // Handle auth message (token sent in first message instead of URL)
      if (!authenticated) {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.type === 'auth' && parsed.token) {
            jwt.verify(parsed.token, process.env.JWT_SECRET);
            authenticated = true;
            if (!attachSession()) return;
            ws.send(JSON.stringify({ type: 'auth', success: true }));
            return;
          }
        } catch (e) {
          ws.send(JSON.stringify({ error: 'Authentication failed' }));
          ws.close();
          return;
        }
        ws.send(JSON.stringify({ error: 'Authentication required' }));
        return;
      }

      // Handle resize events
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
          session.pty.resize(parsed.cols, parsed.rows);
          return;
        }
      } catch (e) {
        // Not JSON, treat as terminal input
      }

      session.pty.write(msg);
    });

    ws.on('close', () => {
      console.log(`WebSocket disconnected for session ${sessionId}`);
      if (dataHandler) dataHandler.dispose();

      // If this socket was replaced by a new one, don't schedule cleanup
      if (ws._replaced) return;

      // Remove from active connections only if this is still the current one
      if (activeConnections.get(sessionId) === ws) {
        activeConnections.delete(sessionId);
      }

      // Delay cleanup to allow reconnection (handles React StrictMode)
      const timer = setTimeout(async () => {
        cleanupTimers.delete(sessionId);

        // If a new connection took over, don't clean up
        if (activeConnections.has(sessionId)) return;

        console.log(`Cleaning up session ${sessionId} (no reconnection)`);
        const cid = session?.containerId;
        destroyPty(sessionId);

        try {
          if (cid) await stopContainer(cid);
          await pool.query('DELETE FROM sessions WHERE ws_session_id = $1', [sessionId]);
        } catch (e) {
          console.error('Cleanup error:', e.message);
        }
      }, 5000);

      cleanupTimers.set(sessionId, timer);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });
}

module.exports = { setupWebSocket };
