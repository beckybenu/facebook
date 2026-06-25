import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';
import { notify } from '../notify.js';
import { MAX_PARTICIPANTS } from './ads.js';

const router = Router();

// Postuler à une annonce
router.post('/ads/:adId/apply', authRequired, async (req, res) => {
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.adId);
  if (!ad) return res.status(404).json({ error: 'Annonce introuvable' });
  if (ad.status === 'cancelled' || ad.status === 'completed') {
    return res.status(400).json({ error: 'Cette annonce n\'accepte plus de candidatures' });
  }
  if (ad.user_id === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas postuler à votre propre annonce' });
  }

  const apps = db.prepare('SELECT * FROM applications WHERE ad_id = ?').all(ad.id);
  if (apps.find((a) => a.user_id === req.user.id)) {
    return res.status(409).json({ error: 'Vous avez déjà postulé à cette annonce' });
  }
  if (apps.length >= MAX_PARTICIPANTS) {
    return res.status(400).json({ error: `Maximum ${MAX_PARTICIPANTS} participants atteint pour cette annonce` });
  }

  const id = nanoid();
  db.prepare('INSERT INTO applications (id, ad_id, user_id, message) VALUES (?, ?, ?, ?)')
    .run(id, ad.id, req.user.id, (req.body && req.body.message) || '');

  await notify(ad.user_id, {
    type: 'new_application',
    title: '🙋 Nouvelle candidature',
    body: `${req.user.full_name} a postulé à « ${ad.title} »`,
    data: { adId: ad.id, applicationId: id },
  });

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.json({ application: app });
});

// Accepter / rejeter une candidature (auteur seulement)
router.post('/:appId/:action', authRequired, async (req, res) => {
  const { appId, action } = req.params;
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'Action inconnue' });

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!app) return res.status(404).json({ error: 'Candidature introuvable' });
  const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(app.ad_id);
  if (ad.user_id !== req.user.id) return res.status(403).json({ error: 'Action réservée à l\'auteur de l\'annonce' });

  if (action === 'accept') {
    const accepted = db.prepare("SELECT COUNT(*) c FROM applications WHERE ad_id = ? AND status IN ('accepted','completed')").get(ad.id);
    if (accepted.c >= MAX_PARTICIPANTS) {
      return res.status(400).json({ error: `Maximum ${MAX_PARTICIPANTS} participants déjà acceptés` });
    }
    db.prepare("UPDATE applications SET status = 'accepted' WHERE id = ?").run(appId);
    db.prepare("UPDATE ads SET status = 'in_progress' WHERE id = ? AND status = 'open'").run(ad.id);
    await notify(app.user_id, {
      type: 'application_accepted',
      title: '✅ Candidature acceptée',
      body: `Votre candidature pour « ${ad.title} » a été acceptée !`,
      data: { adId: ad.id, applicationId: appId },
    });
  } else {
    db.prepare("UPDATE applications SET status = 'rejected' WHERE id = ?").run(appId);
    await notify(app.user_id, {
      type: 'application_rejected',
      title: '❌ Candidature refusée',
      body: `Votre candidature pour « ${ad.title} » n'a pas été retenue`,
      data: { adId: ad.id },
    });
  }

  res.json({ ok: true });
});

// Mes candidatures envoyées
router.get('/mine', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT applications.*, ads.title as ad_title, ads.tip_amount, ads.status as ad_status, ads.photo
    FROM applications JOIN ads ON ads.id = applications.ad_id
    WHERE applications.user_id = ? ORDER BY applications.created_at DESC
  `).all(req.user.id);
  res.json({ applications: rows });
});

export default router;
