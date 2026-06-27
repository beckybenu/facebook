import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { serializeProfile } from '../profileSerializer.js';

const router = Router();

// Public directory with optional filters.
router.get('/', (req, res) => {
  const { city, q, service, minPrice, maxPrice, minAge, maxAge, available, sort } = req.query;
  const clauses = [];
  const params = [];

  if (city) { clauses.push('LOWER(city) = LOWER(?)'); params.push(city); }
  if (service) { clauses.push('services LIKE ?'); params.push(`%"${service}"%`); }
  if (minPrice) { clauses.push('hourly_rate >= ?'); params.push(Number(minPrice)); }
  if (maxPrice) { clauses.push('hourly_rate <= ?'); params.push(Number(maxPrice)); }
  if (minAge) { clauses.push('age >= ?'); params.push(Number(minAge)); }
  if (maxAge) { clauses.push('age <= ?'); params.push(Number(maxAge)); }
  if (available === 'true') { clauses.push('available = 1'); }
  if (q) {
    clauses.push('(LOWER(display_name) LIKE ? OR LOWER(headline) LIKE ? OR LOWER(bio) LIKE ?)');
    const like = `%${String(q).toLowerCase()}%`;
    params.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order =
    sort === 'price_asc' ? 'hourly_rate ASC' :
    sort === 'price_desc' ? 'hourly_rate DESC' :
    sort === 'age_asc' ? 'age ASC' :
    'verified DESC, created_at DESC';

  const rows = db.prepare(`SELECT * FROM profiles ${where} ORDER BY ${order}`).all(...params);
  res.json(rows.map(serializeProfile));
});

router.get('/cities', (_req, res) => {
  const rows = db.prepare('SELECT city, COUNT(*) AS count FROM profiles GROUP BY city ORDER BY count DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Profile not found' });
  res.json(serializeProfile(row));
});

router.get('/:id/reviews', (req, res) => {
  const rows = db
    .prepare(`SELECT r.id, r.rating, r.comment, r.created_at, u.display_name AS author
              FROM reviews r JOIN users u ON u.id = r.client_id
              WHERE r.profile_id = ? ORDER BY r.created_at DESC`)
    .all(req.params.id);
  res.json(rows);
});

// Provider: read own profile.
router.get('/me/profile', requireRole('provider'), (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json(row ? serializeProfile(row) : null);
});

// Provider: create or update own profile.
router.put('/me/profile', requireRole('provider'), (req, res) => {
  const b = req.body || {};
  const age = Number(b.age);
  if (!b.city || !b.displayName) return res.status(400).json({ error: 'displayName and city are required' });
  if (!Number.isFinite(age) || age < 18) return res.status(400).json({ error: 'age must be 18 or older' });

  const fields = {
    display_name: String(b.displayName),
    city: String(b.city),
    age,
    gender: b.gender || 'female',
    headline: b.headline || '',
    bio: b.bio || '',
    hourly_rate: Number(b.hourlyRate) || 0,
    currency: b.currency || 'CHF',
    services: JSON.stringify(Array.isArray(b.services) ? b.services : []),
    languages: JSON.stringify(Array.isArray(b.languages) ? b.languages : []),
    photo_url: b.photoUrl || '',
    available: b.available ? 1 : 0,
  };

  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`UPDATE profiles SET display_name=@display_name, city=@city, age=@age, gender=@gender,
      headline=@headline, bio=@bio, hourly_rate=@hourly_rate, currency=@currency, services=@services,
      languages=@languages, photo_url=@photo_url, available=@available WHERE user_id=@user_id`)
      .run({ ...fields, user_id: req.user.id });
  } else {
    db.prepare(`INSERT INTO profiles (user_id, display_name, city, age, gender, headline, bio, hourly_rate,
      currency, services, languages, photo_url, available)
      VALUES (@user_id,@display_name,@city,@age,@gender,@headline,@bio,@hourly_rate,@currency,@services,@languages,@photo_url,@available)`)
      .run({ ...fields, user_id: req.user.id });
  }
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json(serializeProfile(row));
});

export default router;
