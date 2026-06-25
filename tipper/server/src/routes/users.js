import { Router } from 'express';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';

const router = Router();

// Mettre à jour le profil + position géographique
router.patch('/me', authRequired, (req, res) => {
  const { full_name, bio, avatar, lat, lng, city } = req.body || {};
  const u = req.user;
  db.prepare('UPDATE users SET full_name = ?, bio = ?, avatar = ?, lat = ?, lng = ?, city = ? WHERE id = ?').run(
    full_name ?? u.full_name,
    bio ?? u.bio,
    avatar ?? u.avatar,
    lat != null ? parseFloat(lat) : u.lat,
    lng != null ? parseFloat(lng) : u.lng,
    city ?? u.city,
    u.id
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  res.json({ user: publicUser(user) });
});

// Mettre à jour uniquement la position (appelé par la géoloc du navigateur)
router.post('/me/location', authRequired, (req, res) => {
  const { lat, lng, city } = req.body || {};
  if (lat == null || lng == null) return res.status(400).json({ error: 'Coordonnées manquantes' });
  db.prepare('UPDATE users SET lat = ?, lng = ?, city = COALESCE(?, city) WHERE id = ?')
    .run(parseFloat(lat), parseFloat(lng), city || null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.get('/:id', authRequired, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const adsCount = db.prepare('SELECT COUNT(*) c FROM ads WHERE user_id = ?').get(u.id).c;
  const tipsReceived = db.prepare("SELECT COUNT(*) c FROM transactions WHERE user_id = ? AND type = 'tip_in'").get(u.id).c;
  res.json({ user: publicUser(u), stats: { ads: adsCount, tips_received: tipsReceived } });
});

export default router;
