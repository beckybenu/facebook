import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';
import { distanceKm } from '../geo.js';
import { notify } from '../notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${nanoid()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const MAX_PARTICIPANTS = 3;
export const CATEGORIES = ['administratif', 'automobile', 'epicerie', 'immobilier', 'petit_service', 'loisirs'];

const router = Router();

function adWithMeta(ad, viewer) {
  const author = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  const apps = db.prepare('SELECT * FROM applications WHERE ad_id = ?').all(ad.id);
  const accepted = apps.filter((a) => a.status === 'accepted' || a.status === 'completed');
  return {
    ...ad,
    author: publicUser(author),
    applicants_count: apps.length,
    accepted_count: accepted.length,
    spots_left: Math.max(0, MAX_PARTICIPANTS - accepted.length),
    max_participants: MAX_PARTICIPANTS,
    distance_km: viewer ? distanceKm(viewer.lat, viewer.lng, ad.lat, ad.lng) : null,
    my_application: viewer ? apps.find((a) => a.user_id === viewer.id) || null : null,
    is_mine: viewer ? ad.user_id === viewer.id : false,
  };
}

// List ads (feed). Optional filters: category, q, mine, max_km
router.get('/', authRequired, (req, res) => {
  const { category, q, mine } = req.query;
  let sql = 'SELECT * FROM ads WHERE 1=1';
  const params = [];
  if (mine === '1') { sql += ' AND user_id = ?'; params.push(req.user.id); }
  else { sql += " AND status != 'cancelled'"; }
  if (category && CATEGORIES.includes(category)) { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC LIMIT 200';

  let ads = db.prepare(sql).all(...params).map((a) => adWithMeta(a, req.user));

  // Sort by distance when viewer has a location and not filtering "mine"
  if (mine !== '1' && req.user.lat != null) {
    ads = ads.sort((a, b) => {
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  }
  res.json({ ads, categories: CATEGORIES });
});

router.get('/:id', authRequired, (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Annonce introuvable' });
  const meta = adWithMeta(ad, req.user);
  // Include applicants details for the author
  if (meta.is_mine) {
    meta.applications = db.prepare('SELECT * FROM applications WHERE ad_id = ? ORDER BY created_at').all(ad.id)
      .map((a) => ({ ...a, applicant: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(a.user_id)) }));
  }
  res.json({ ad: meta });
});

router.post('/', authRequired, upload.single('photo'), (req, res) => {
  const { category, title, price, tip_amount, description, lat, lng, city } = req.body || {};
  if (!category || !CATEGORIES.includes(category)) return res.status(400).json({ error: 'Catégorie invalide' });
  if (!title) return res.status(400).json({ error: 'Le titre est requis' });
  const tip = parseFloat(tip_amount) || 0;
  if (tip <= 0) return res.status(400).json({ error: 'Le pourboire (j\'offre) doit être supérieur à 0' });
  if (tip > req.user.wallet_balance) {
    return res.status(400).json({ error: 'Solde insuffisant pour garantir ce pourboire. Rechargez votre wallet.' });
  }

  const id = nanoid();
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare(`INSERT INTO ads (id, user_id, category, title, price, tip_amount, photo, description, lat, lng, city)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user.id, category, title,
    price != null && price !== '' ? parseFloat(price) : null,
    tip, photo, description || '',
    lat ? parseFloat(lat) : req.user.lat,
    lng ? parseFloat(lng) : req.user.lng,
    city || req.user.city
  );
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(id);
  res.json({ ad: adWithMeta(ad, req.user) });
});

// Mark an accepted applicant as completed -> pay the tip from wallet
router.post('/:id/complete', authRequired, async (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Annonce introuvable' });
  if (ad.user_id !== req.user.id) return res.status(403).json({ error: 'Action réservée à l\'auteur' });

  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND ad_id = ?')
    .get(req.body.application_id, ad.id);
  if (!application || application.status !== 'accepted') {
    return res.status(400).json({ error: 'Candidature non valide ou non acceptée' });
  }

  const author = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  if (author.wallet_balance < ad.tip_amount) {
    return res.status(400).json({ error: 'Solde insuffisant pour verser le pourboire' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(ad.tip_amount, author.id);
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(ad.tip_amount, application.user_id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), author.id, 'tip_out', -ad.tip_amount, `Pourboire versé · ${ad.title}`, ad.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), application.user_id, 'tip_in', ad.tip_amount, `Pourboire reçu · ${ad.title}`, ad.id);
    db.prepare("UPDATE applications SET status = 'completed' WHERE id = ?").run(application.id);
    db.prepare("UPDATE ads SET status = 'completed' WHERE id = ?").run(ad.id);
  });
  tx();

  await notify(application.user_id, {
    type: 'tip_received',
    title: '💰 Pourboire reçu !',
    body: `Vous avez reçu CHF ${ad.tip_amount.toFixed(2)} pour « ${ad.title} »`,
    data: { adId: ad.id, amount: ad.tip_amount },
  });

  res.json({ ok: true });
});

router.post('/:id/cancel', authRequired, (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Annonce introuvable' });
  if (ad.user_id !== req.user.id) return res.status(403).json({ error: 'Action réservée à l\'auteur' });
  db.prepare("UPDATE ads SET status = 'cancelled' WHERE id = ?").run(ad.id);
  res.json({ ok: true });
});

export { adWithMeta, MAX_PARTICIPANTS };
export default router;
