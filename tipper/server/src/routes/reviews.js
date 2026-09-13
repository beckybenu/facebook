import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, addXp } from '../auth.js';
import { notify } from '../notify.js';

const router = Router();

router.post('/', authRequired, async (req, res) => {
  let { ad_id, ratee_id, stars, comment, role } = req.body || {};
  stars = Math.max(1, Math.min(5, parseInt(stars, 10) || 5));
  if (!ratee_id) return res.status(400).json({ error: 'Destinataire requis' });
  const dup = db.prepare('SELECT 1 FROM reviews WHERE ad_id = ? AND rater_id = ? AND ratee_id = ?').get(ad_id || null, req.user.id, ratee_id);
  if (dup) return res.status(409).json({ error: 'Vous avez déjà laissé un avis' });

  db.prepare('INSERT INTO reviews (id, ad_id, rater_id, ratee_id, role, stars, comment) VALUES (?,?,?,?,?,?,?)')
    .run(nanoid(), ad_id || null, req.user.id, ratee_id, role || 'helper', stars, comment || '');
  db.prepare('UPDATE users SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?').run(stars, ratee_id);
  if (stars === 5) addXp(ratee_id, 20);
  await notify(ratee_id, { type: 'new_review', title: `⭐ Nouvel avis (${stars}/5)`, body: `${req.user.full_name} vous a évalué`, data: { fromUserId: req.user.id } });
  res.json({ ok: true });
});

export default router;
