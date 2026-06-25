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

// Vérification d'identité (KYC)
router.post('/kyc', authRequired, (req, res) => {
  const { doc_type } = req.body || {};
  if (!doc_type) return res.status(400).json({ error: 'Type de document requis' });
  db.prepare("UPDATE users SET kyc_status = 'pending', kyc_doc_type = ? WHERE id = ?").run(doc_type, req.user.id);
  res.json({ ok: true, status: 'pending' });
});
router.post('/kyc/finalize', authRequired, (req, res) => {
  if (req.user.kyc_status !== 'pending') return res.status(400).json({ error: 'Aucune vérification en cours' });
  db.prepare("UPDATE users SET kyc_status = 'verified', verified = 1, xp = xp + 30 WHERE id = ?").run(req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.get('/:id', authRequired, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const ads = db.prepare('SELECT COUNT(*) c FROM ads WHERE user_id = ?').get(u.id).c;
  const completed = db.prepare("SELECT COUNT(*) c FROM applications WHERE user_id = ? AND status = 'completed'").get(u.id).c;
  const earned = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE user_id = ? AND type = 'tip_in'").get(u.id).s;
  const reviews = db.prepare('SELECT * FROM reviews WHERE ratee_id = ? ORDER BY created_at DESC LIMIT 50').all(u.id)
    .map((r) => ({ ...r, rater: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(r.rater_id)) }));
  res.json({ user: publicUser(u), stats: { ads, completed, earned }, reviews });
});

export default router;
