import { Router } from 'express';
import db from '../db.js';
import { requireRole } from '../auth.js';
import { serializeProfile } from '../profileSerializer.js';

const router = Router();

router.get('/', requireRole('client'), (req, res) => {
  const rows = db
    .prepare(`SELECT p.* FROM favorites f JOIN profiles p ON p.id = f.profile_id
              WHERE f.client_id = ? ORDER BY f.created_at DESC`)
    .all(req.user.id);
  res.json(rows.map(serializeProfile));
});

router.post('/:profileId', requireRole('client'), (req, res) => {
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(req.params.profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  db.prepare('INSERT OR IGNORE INTO favorites (client_id, profile_id) VALUES (?,?)')
    .run(req.user.id, profile.id);
  res.status(201).json({ ok: true });
});

router.delete('/:profileId', requireRole('client'), (req, res) => {
  db.prepare('DELETE FROM favorites WHERE client_id = ? AND profile_id = ?')
    .run(req.user.id, req.params.profileId);
  res.json({ ok: true });
});

export default router;
