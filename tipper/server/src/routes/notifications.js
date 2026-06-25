import { Router } from 'express';
import db from '../db.js';
import { authRequired } from '../auth.js';
import { saveSubscription, VAPID_PUBLIC_KEY } from '../push.js';

const router = Router();

router.get('/vapid-key', (_req, res) => res.json({ key: VAPID_PUBLIC_KEY }));

router.post('/subscribe', authRequired, (req, res) => {
  const sub = req.body && req.body.subscription;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Abonnement invalide' });
  saveSubscription(req.user.id, sub);
  res.json({ ok: true });
});

router.get('/', authRequired, (req, res) => {
  const items = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id).c;
  res.json({ notifications: items.map((n) => ({ ...n, data: JSON.parse(n.data || '{}') })), unread });
});

router.post('/read', authRequired, (req, res) => {
  if (req.body && req.body.id) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.body.id, req.user.id);
  } else {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  }
  res.json({ ok: true });
});

export default router;
