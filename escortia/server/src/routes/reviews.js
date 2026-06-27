import { Router } from 'express';
import db from '../db.js';
import { requireRole } from '../auth.js';

const router = Router();

// Client posts (or updates) a review for a profile. Requires a prior booking.
router.post('/:profileId', requireRole('client'), (req, res) => {
  const { rating, comment } = req.body || {};
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return res.status(400).json({ error: 'rating must be an integer from 1 to 5' });
  }
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(req.params.profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const booked = db
    .prepare('SELECT id FROM bookings WHERE client_id = ? AND profile_id = ? LIMIT 1')
    .get(req.user.id, profile.id);
  if (!booked) return res.status(403).json({ error: 'You can only review companions you have booked' });

  db.prepare(
    `INSERT INTO reviews (profile_id, client_id, rating, comment) VALUES (?,?,?,?)
     ON CONFLICT(profile_id, client_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment`
  ).run(profile.id, req.user.id, value, comment || '');

  res.status(201).json({ ok: true });
});

export default router;
