import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Conversation list: latest message per counterpart + unread count.
router.get('/', requireAuth, (req, res) => {
  const me = req.user.id;
  const rows = db
    .prepare(
      `SELECT m.*,
              CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END AS other_id
       FROM messages m
       WHERE m.sender_id = ? OR m.recipient_id = ?
       ORDER BY m.created_at DESC`
    )
    .all(me, me, me);

  const seen = new Map();
  for (const m of rows) {
    if (!seen.has(m.other_id)) {
      const other = db.prepare('SELECT id, display_name, role FROM users WHERE id = ?').get(m.other_id);
      seen.set(m.other_id, {
        userId: m.other_id,
        displayName: other?.display_name || 'Unknown',
        role: other?.role,
        lastMessage: m.body,
        lastAt: m.created_at,
        unread: 0,
      });
    }
    if (m.recipient_id === me && !m.read) seen.get(m.other_id).unread += 1;
  }
  res.json([...seen.values()]);
});

// Full thread with one counterpart (marks incoming as read).
router.get('/:userId', requireAuth, (req, res) => {
  const me = req.user.id;
  const other = Number(req.params.userId);
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       ORDER BY created_at ASC`
    )
    .all(me, other, other, me);
  db.prepare('UPDATE messages SET read = 1 WHERE recipient_id = ? AND sender_id = ?').run(me, other);
  res.json(rows.map((m) => ({ ...m, mine: m.sender_id === me })));
});

router.post('/:userId', requireAuth, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Message body is required' });
  const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.userId);
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  const info = db
    .prepare('INSERT INTO messages (sender_id, recipient_id, body) VALUES (?,?,?)')
    .run(req.user.id, recipient.id, String(body).trim());
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...msg, mine: true });
});

router.get('/unread/count', requireAuth, (req, res) => {
  const row = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE recipient_id = ? AND read = 0').get(req.user.id);
  res.json({ count: row.count });
});

export default router;
