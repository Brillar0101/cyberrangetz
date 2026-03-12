const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { startContainer, startLabEnvironment, stopContainer } = require('../services/dockerService');
const { createPty, sessions } = require('../services/terminalService');

const router = express.Router();

// Load all module files
const labsDir = path.join(__dirname, '../../labs/configs');
const moduleFiles = fs.readdirSync(labsDir).filter(f => f.endsWith('.json')).sort();
const modules = moduleFiles.map(f =>
  JSON.parse(fs.readFileSync(path.join(labsDir, f), 'utf-8'))
);

// Flat lookup of all labs across modules
function findLab(labId) {
  for (const mod of modules) {
    const lab = mod.labs.find(l => l.id === labId);
    if (lab) return { lab, moduleName: mod.module };
  }
  return {};
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const completions = await pool.query(
      'SELECT lab_id FROM completions WHERE user_id = $1',
      [req.user.id]
    );
    const completedLabs = completions.rows.map(r => r.lab_id);

    const result = modules.map(mod => ({
      module: mod.module,
      labs: mod.labs.map(lab => ({
        id: lab.id,
        title: lab.title,
        type: lab.type,
        module: mod.module,
        steps: lab.steps.map(s => ({
          id: s.id,
          title: s.title,
          explanation: s.explanation,
          command: s.command,
          question: s.question,
        })),
        completed: completedLabs.includes(lab.id),
        locked: lab.prerequisite ? !completedLabs.includes(lab.prerequisite) : false,
      }))
    }));

    res.json({ modules: result });
  } catch (err) {
    console.error('Get labs error:', err);
    res.status(500).json({ error: 'Failed to load labs' });
  }
});

router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const labId = req.params.id;
    const userId = req.user.id;
    const { lab } = findLab(labId);

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Check prerequisite
    if (lab.prerequisite) {
      const completion = await pool.query(
        'SELECT id FROM completions WHERE user_id = $1 AND lab_id = $2',
        [userId, lab.prerequisite]
      );
      if (completion.rows.length === 0) {
        return res.status(403).json({ error: 'Complete the prerequisite lab first' });
      }
    }

    // Check for existing active session
    const existing = await pool.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW()",
      [userId]
    );

    if (existing.rows.length > 0) {
      const session = existing.rows[0];
      // Stop the old container
      try {
        await stopContainer(session.container_id);
      } catch (e) {
        // Container may already be stopped
      }
      await pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);
    }

    // Start container(s) — multi-container labs use environment config
    let containerId;
    if (lab.environment) {
      containerId = await startLabEnvironment(userId, labId, lab.environment);
    } else {
      containerId = await startContainer(userId, labId, lab.docker_image);
    }
    const { sessionId } = createPty(containerId);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await pool.query(
      'INSERT INTO sessions (user_id, lab_id, container_id, ws_session_id, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, labId, containerId, sessionId, expiresAt]
    );

    res.json({ wsSessionId: sessionId, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('Start lab error:', err);
    res.status(500).json({ error: 'Failed to start lab. Please try again.' });
  }
});

router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND lab_id = $2 ORDER BY started_at DESC LIMIT 1',
      [userId, req.params.id]
    );

    if (session.rows.length > 0) {
      const s = session.rows[0];
      try {
        // Clean up pty
        if (sessions.has(s.ws_session_id)) {
          const ptySession = sessions.get(s.ws_session_id);
          ptySession.pty.kill();
          sessions.delete(s.ws_session_id);
        }
        await stopContainer(s.container_id);
      } catch (e) {
        // Container may already be stopped
      }
      await pool.query('DELETE FROM sessions WHERE id = $1', [s.id]);
    }

    res.json({ message: 'Session ended' });
  } catch (err) {
    console.error('Stop lab error:', err);
    res.status(500).json({ error: 'Failed to stop lab' });
  }
});

router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const labId = req.params.id;
    const { flag } = req.body;
    const { lab } = findLab(labId);

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    if (flag !== lab.flag) {
      return res.status(400).json({ error: 'Incorrect flag. Try again!' });
    }

    // Mark as complete (upsert)
    await pool.query(
      'INSERT INTO completions (user_id, lab_id) VALUES ($1, $2) ON CONFLICT (user_id, lab_id) DO NOTHING',
      [req.user.id, labId]
    );

    res.json({ success: true, message: 'Lab completed!' });
  } catch (err) {
    console.error('Submit flag error:', err);
    res.status(500).json({ error: 'Failed to submit flag' });
  }
});

router.post('/:id/check-answer', authenticateToken, (req, res) => {
  const labId = req.params.id;
  const { stepId, answer } = req.body;
  const { lab } = findLab(labId);

  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }

  const step = lab.steps.find(s => s.id === stepId);
  if (!step) {
    return res.status(404).json({ error: 'Step not found' });
  }

  const correct = answer.trim().toLowerCase() === step.answer.trim().toLowerCase();
  res.json({ correct });
});

module.exports = router;
