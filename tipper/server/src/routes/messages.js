import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';
import { notify } from '../notify.js';

const router = Router();

// Liste des conversations (regroupées par interlocuteur)
router.get('/threads', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id, req.user.id);

  const threads = new Map();
  for (const m of rows) {
    const other = m.sender_id === req.user.id ? m.receiver_id : m.sender_id;
    if (!threads.has(other)) {
      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(other);
      threads.set(other, {
        user: publicUser(u),
        last_message: m.body,
        last_at: m.created_at,
        unread: 0,
      });
    }
    if (m.receiver_id === req.user.id && !m.read) threads.get(other).unread += 1;
  }
  res.json({ threads: [...threads.values()] });
});

// Messages avec un interlocuteur
router.get('/with/:userId', authRequired, (req, res) => {
  const msgs = db.prepare(`
    SELECT * FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC LIMIT 200
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);
  db.prepare('UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?').run(req.user.id, req.params.userId);
  const other = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  res.json({ messages: msgs, user: publicUser(other) });
});

router.post('/send', authRequired, async (req, res) => {
  const { receiver_id, body, ad_id } = req.body || {};
  if (!receiver_id || !body) return res.status(400).json({ error: 'Destinataire et message requis' });
  const receiver = db.prepare('SELECT * FROM users WHERE id = ?').get(receiver_id);
  if (!receiver) return res.status(404).json({ error: 'Destinataire introuvable' });

  const id = nanoid();
  db.prepare('INSERT INTO messages (id, ad_id, sender_id, receiver_id, body) VALUES (?,?,?,?,?)')
    .run(id, ad_id || null, req.user.id, receiver_id, body);

  await notify(receiver_id, {
    type: 'new_message',
    title: `💬 ${req.user.full_name}`,
    body: body.length > 80 ? body.slice(0, 80) + '…' : body,
    data: { fromUserId: req.user.id },
  });

  res.json({ message: db.prepare('SELECT * FROM messages WHERE id = ?').get(id) });
});

export default router;
