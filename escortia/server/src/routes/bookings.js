import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Client creates a booking request for a profile.
router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Only clients can request bookings' });
  const { profileId, date, duration, note } = req.body || {};
  if (!profileId || !date) return res.status(400).json({ error: 'profileId and date are required' });

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const info = db
    .prepare('INSERT INTO bookings (client_id, profile_id, date, duration, note) VALUES (?,?,?,?,?)')
    .run(req.user.id, profileId, date, Number(duration) || 1, note || '');
  res.status(201).json(getBooking(info.lastInsertRowid));
});

// List bookings relevant to the current user (client's requests or provider's incoming).
router.get('/', requireAuth, (req, res) => {
  let rows;
  if (req.user.role === 'client') {
    rows = db
      .prepare(`SELECT b.*, p.display_name AS profile_name, p.city AS profile_city, p.photo_url AS profile_photo
                FROM bookings b JOIN profiles p ON p.id = b.profile_id
                WHERE b.client_id = ? ORDER BY b.created_at DESC`)
      .all(req.user.id);
  } else {
    rows = db
      .prepare(`SELECT b.*, u.display_name AS client_name
                FROM bookings b
                JOIN profiles p ON p.id = b.profile_id
                JOIN users u ON u.id = b.client_id
                WHERE p.user_id = ? ORDER BY b.created_at DESC`)
      .all(req.user.id);
  }
  res.json(rows);
});

// Provider accepts/declines/completes; client may cancel their own pending request.
router.patch('/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const valid = ['accepted', 'declined', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const profile = db.prepare('SELECT user_id FROM profiles WHERE id = ?').get(booking.profile_id);
  const isProvider = profile && profile.user_id === req.user.id;
  const isClient = booking.client_id === req.user.id;

  if (status === 'cancelled' && !isClient) return res.status(403).json({ error: 'Only the client can cancel' });
  if (status !== 'cancelled' && !isProvider) return res.status(403).json({ error: 'Only the provider can update this' });

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, booking.id);
  res.json(getBooking(booking.id));
});

function getBooking(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

export default router;
