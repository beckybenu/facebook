import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser, addXp, isAdminEmail } from '../auth.js';
import { distanceKm } from '../geo.js';
import { notify } from '../notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${nanoid()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const MAX_PARTICIPANTS = 3;
const COMMISSION = 0.10;
const CONSOLATION_POINTS = 10;
export const CATEGORIES = ['administratif', 'automobile', 'epicerie', 'immobilier', 'petit_service', 'loisirs'];

const router = Router();

function adWithMeta(ad, viewer) {
  const author = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  const apps = db.prepare('SELECT * FROM applications WHERE ad_id = ?').all(ad.id);
  const active = apps.filter((a) => a.status !== 'rejected'); // une place = un postulant actif
  const accepted = apps.filter((a) => ['accepted', 'delivered', 'completed'].includes(a.status));
  const isSaved = viewer ? !!db.prepare('SELECT 1 FROM saved_ads WHERE user_id = ? AND ad_id = ?').get(viewer.id, ad.id) : false;
  const spotsLeft = Math.max(0, MAX_PARTICIPANTS - active.length);
  return {
    ...ad, urgent: !!ad.urgent,
    author: publicUser(author),
    applicants_count: apps.length,
    accepted_count: accepted.length,
    spots_left: spotsLeft,
    is_full: spotsLeft <= 0,
    max_participants: MAX_PARTICIPANTS,
    distance_km: viewer ? distanceKm(viewer.lat, viewer.lng, ad.lat, ad.lng) : null,
    my_application: viewer ? apps.find((a) => a.user_id === viewer.id) || null : null,
    is_mine: viewer ? ad.user_id === viewer.id : false,
    is_saved: isSaved,
  };
}

// Liste / feed avec filtres et tri
router.get('/', authRequired, (req, res) => {
  const { category, q, mine, saved, urgent, sort, radius } = req.query;
  let sql = 'SELECT * FROM ads WHERE 1=1'; const params = [];
  if (mine === '1') { sql += ' AND user_id = ?'; params.push(req.user.id); }
  else if (saved === '1') { sql += ' AND id IN (SELECT ad_id FROM saved_ads WHERE user_id = ?)'; params.push(req.user.id); }
  else sql += " AND status != 'cancelled'";
  if (category && CATEGORIES.includes(category)) { sql += ' AND category = ?'; params.push(category); }
  if (urgent === '1') sql += ' AND urgent = 1';
  if (q) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC LIMIT 300';

  let ads = db.prepare(sql).all(...params).map((a) => adWithMeta(a, req.user));
  // Visibilité : annonce complète/terminée masquée aux non-participants (sauf admin)
  if (mine !== '1' && saved !== '1' && !isAdminEmail(req.user.email)) {
    ads = ads.filter((a) => a.is_mine || a.my_application || (!a.is_full && a.status !== 'completed'));
  }
  if (radius && req.user.lat != null) ads = ads.filter((a) => a.distance_km == null || a.distance_km <= Number(radius));
  const s = sort || (req.user.lat != null ? 'distance' : 'recent');
  ads.sort((a, b) => {
    if (s === 'tip') return b.tip_amount - a.tip_amount;
    if (s === 'rating') return (b.author.rating || 0) - (a.author.rating || 0);
    if (s === 'distance') return (a.distance_km == null ? 1e9 : a.distance_km) - (b.distance_km == null ? 1e9 : b.distance_km);
    return b.created_at.localeCompare(a.created_at);
  });
  res.json({ ads, categories: CATEGORIES });
});

router.get('/:id', authRequired, (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
  const meta = adWithMeta(ad, req.user);
  if (meta.is_full && !meta.is_mine && !meta.my_application && !isAdminEmail(req.user.email)) {
    return res.status(403).json({ error: 'Cette annonce est complète' });
  }
  meta.applications = db.prepare('SELECT * FROM applications WHERE ad_id = ? ORDER BY created_at').all(ad.id)
    .map((a) => ({ ...a, applicant: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(a.user_id)) }));
  meta.reviews = db.prepare('SELECT * FROM reviews WHERE ad_id = ? ORDER BY created_at DESC').all(ad.id)
    .map((r) => ({ ...r, rater: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(r.rater_id)) }));
  res.json({ ad: meta });
});

router.post('/', authRequired, upload.single('photo'), (req, res) => {
  const { category, title, price, tip_amount, description, lat, lng, city, urgent, scheduled_at } = req.body || {};
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Catégorie invalide' });
  if (!title) return res.status(400).json({ error: 'Le titre est requis' });
  const tip = parseFloat(tip_amount) || 0;
  if (tip <= 0) return res.status(400).json({ error: "Le pourboire doit être supérieur à 0" });
  if (tip > req.user.wallet_balance) return res.status(400).json({ error: 'Solde disponible insuffisant. Rechargez votre wallet.' });

  const id = nanoid();
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const tx = db.transaction(() => {
    // ESCROW : bloque le pourboire
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ?, reserved = reserved + ? WHERE id = ?').run(tip, tip, req.user.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
      .run(nanoid(), req.user.id, 'escrow_hold', -tip, `Pourboire bloqué · ${title}`);
    db.prepare(`INSERT INTO ads (id, user_id, category, title, price, tip_amount, photo, description, lat, lng, city, urgent, scheduled_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, req.user.id, category, title,
      price != null && price !== '' ? parseFloat(price) : null, tip, photo, description || '',
      lat ? parseFloat(lat) : req.user.lat, lng ? parseFloat(lng) : req.user.lng, city || req.user.city,
      urgent === '1' || urgent === 'true' ? 1 : 0, scheduled_at || null
    );
    addXp(req.user.id, 10);
  });
  tx();
  res.json({ ad: adWithMeta(db.prepare('SELECT * FROM ads WHERE id = ?').get(id), db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

// Favori (toggle)
router.post('/:id/save', authRequired, (req, res) => {
  const exists = db.prepare('SELECT 1 FROM saved_ads WHERE user_id = ? AND ad_id = ?').get(req.user.id, req.params.id);
  if (exists) db.prepare('DELETE FROM saved_ads WHERE user_id = ? AND ad_id = ?').run(req.user.id, req.params.id);
  else db.prepare('INSERT INTO saved_ads (user_id, ad_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  res.json({ saved: !exists });
});

// Helper marque la mission livrée
router.post('/:id/deliver', authRequired, async (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND ad_id = ?').get(req.body.application_id, ad.id);
  if (!app || app.user_id !== req.user.id) return res.status(403).json({ error: 'Action non autorisée' });
  if (app.status !== 'accepted') return res.status(400).json({ error: 'La mission doit être acceptée' });
  db.prepare("UPDATE applications SET status = 'delivered' WHERE id = ?").run(app.id);
  db.prepare("UPDATE ads SET status = 'delivered', delivered_app = ? WHERE id = ?").run(app.id, ad.id);
  await notify(ad.user_id, { type: 'mission_delivered', title: '📦 Mission livrée', body: `${req.user.full_name} a terminé « ${ad.title} ». Confirmez pour libérer le pourboire.`, data: { adId: ad.id } });
  res.json({ ok: true });
});

// Demandeur confirme -> libère l'escrow et paie le helper
router.post('/:id/confirm', authRequired, async (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
  if (ad.user_id !== req.user.id) return res.status(403).json({ error: 'Action réservée au demandeur' });
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND ad_id = ?').get(req.body.application_id, ad.id);
  if (!app || !['accepted', 'delivered'].includes(app.status)) return res.status(400).json({ error: 'Candidature non valide' });
  const author = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  if (author.reserved < ad.tip_amount) return res.status(400).json({ error: 'Escrow insuffisant' });

  const commission = Math.round(ad.tip_amount * COMMISSION * 100) / 100;
  const net = Math.round((ad.tip_amount - commission) * 100) / 100;
  const others = db.prepare('SELECT * FROM applications WHERE ad_id = ? AND user_id != ?').all(ad.id, app.user_id);

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET reserved = reserved - ? WHERE id = ?').run(ad.tip_amount, author.id);
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(net, app.user_id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), author.id, 'tip_out', -ad.tip_amount, `Pourboire versé · ${ad.title}`, ad.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), app.user_id, 'tip_in', net, `Pourboire reçu (–10% commission) · ${ad.title}`, ad.id);
    db.prepare("INSERT INTO commissions (id, ad_id, amount) VALUES (?,?,?)").run(nanoid(), ad.id, commission);
    db.prepare("UPDATE applications SET status = 'completed' WHERE id = ?").run(app.id);
    db.prepare("UPDATE ads SET status = 'completed' WHERE id = ?").run(ad.id);
    addXp(app.user_id, 50); addXp(author.id, 15);
    // Consolation : les autres candidats reçoivent des Tipper Points
    for (const o of others) {
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(CONSOLATION_POINTS, o.user_id);
      if (['pending', 'accepted', 'delivered'].includes(o.status)) db.prepare("UPDATE applications SET status = 'rejected' WHERE id = ?").run(o.id);
    }
  });
  tx();
  await notify(app.user_id, { type: 'tip_received', title: '💰 Pourboire reçu !', body: `${net} 🪙 crédités (après 10% de commission) pour « ${ad.title} ». +50 XP !`, data: { adId: ad.id, review: true, rateeId: author.id } });
  for (const o of others) {
    await notify(o.user_id, { type: 'points_earned', title: `🎯 +${CONSOLATION_POINTS} Tipper Points`, body: `Mission « ${ad.title} » attribuée, mais voici ${CONSOLATION_POINTS} points à échanger !`, data: { adId: ad.id } });
  }
  res.json({ ok: true, net, commission });
});

// Annulation -> remboursement de l'escrow
router.post('/:id/cancel', authRequired, (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
  if (ad.user_id !== req.user.id) return res.status(403).json({ error: 'Action réservée au demandeur' });
  if (ad.status === 'completed') return res.status(400).json({ error: 'Mission déjà terminée' });
  const author = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  const tx = db.transaction(() => {
    if (author.reserved >= ad.tip_amount) {
      db.prepare('UPDATE users SET reserved = reserved - ?, wallet_balance = wallet_balance + ? WHERE id = ?').run(ad.tip_amount, ad.tip_amount, author.id);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
        .run(nanoid(), author.id, 'escrow_refund', ad.tip_amount, `Pourboire remboursé · ${ad.title}`, ad.id);
    }
    db.prepare("UPDATE ads SET status = 'cancelled' WHERE id = ?").run(ad.id);
  });
  tx();
  res.json({ ok: true });
});

// Litige / signalement
router.post('/:id/dispute', authRequired, async (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
  const reason = (req.body && req.body.reason) || 'Non précisé';
  db.prepare('INSERT INTO disputes (id, ad_id, opener_id, reason) VALUES (?,?,?,?)').run(nanoid(), ad.id, req.user.id, reason);
  const other = ad.user_id === req.user.id ? null : ad.user_id;
  if (other) await notify(other, { type: 'dispute', title: '⚠️ Litige ouvert', body: `Un litige a été ouvert sur « ${ad.title} »`, data: { adId: ad.id } });
  res.json({ ok: true });
});

export { adWithMeta, MAX_PARTICIPANTS };
export default router;
