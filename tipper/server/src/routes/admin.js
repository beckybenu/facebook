import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, adminRequired, publicUser } from '../auth.js';
import { settleMission, refundMission } from '../settle.js';

const router = Router();
const r2 = (n) => Math.round((n || 0) * 100) / 100;
const commissionAvailable = () =>
  r2((db.prepare('SELECT COALESCE(SUM(amount),0) s FROM commissions').get().s)
    - (db.prepare('SELECT COALESCE(SUM(amount),0) s FROM commission_payouts').get().s));

router.get('/stats', authRequired, adminRequired, (_req, res) => {
  const usersCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const missions = db.prepare('SELECT COUNT(*) c FROM ads').get().c;
  const completed = db.prepare("SELECT COUNT(*) c FROM ads WHERE status = 'completed'").get().c;
  const open = db.prepare("SELECT COUNT(*) c FROM ads WHERE status IN ('open','in_progress')").get().c;
  const gmv = db.prepare("SELECT COALESCE(SUM(tip_amount),0) s FROM ads WHERE status = 'completed'").get().s;
  const commission = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM commissions').get().s;
  const disputesOpen = db.prepare("SELECT COUNT(*) c FROM disputes WHERE status = 'open'").get().c;
  const circulating = db.prepare('SELECT COALESCE(SUM(wallet_balance + reserved),0) s FROM users').get().s;
  const proUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE pro_until IS NOT NULL AND pro_until > datetime('now')").get().c;
  const bySource = (src) => r2(db.prepare('SELECT COALESCE(SUM(amount),0) s FROM commissions WHERE source = ?').get(src).s);

  const ads = db.prepare('SELECT * FROM ads ORDER BY created_at DESC LIMIT 200').all().map((a) => {
    const apps = db.prepare("SELECT COUNT(*) c FROM applications WHERE ad_id = ? AND status != 'rejected'").get(a.id).c;
    const author = db.prepare('SELECT full_name FROM users WHERE id = ?').get(a.user_id);
    return { id: a.id, title: a.title, status: a.status, tip_amount: a.tip_amount, category: a.category,
      author: author?.full_name || '—', applicants: apps, spots_left: Math.max(0, 3 - apps), is_full: apps >= 3, created_at: a.created_at };
  });
  const users = db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT 200').all().map((u) => {
    const p = publicUser(u);
    return { id: u.id, full_name: u.full_name, email: u.email, city: u.city, available: u.wallet_balance, points: u.points || 0, xp: u.xp || 0, verified: !!u.verified, banned: !!u.banned, rating: p.rating, rating_count: p.rating_count };
  });
  const disputes = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC LIMIT 100').all().map((d) => ({
    ...d,
    ad_title: db.prepare('SELECT title FROM ads WHERE id = ?').get(d.ad_id)?.title || '—',
    opener_name: db.prepare('SELECT full_name FROM users WHERE id = ?').get(d.opener_id)?.full_name || '—',
  }));

  // Revenus 14 jours
  const revenue = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const amount = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM commissions WHERE substr(created_at,1,10) = ?").get(day).s;
    revenue.push({ date: day, amount: r2(amount) });
  }

  res.json({
    kpis: { users: usersCount, missions, completed, open, gmv: r2(gmv), commission: r2(commission),
      commission_available: commissionAvailable(), disputes_open: disputesOpen, coins_in_circulation: r2(circulating),
      pro_users: proUsers, rev_commission: bySource('commission'), rev_boost: bySource('boost'), rev_subscription: bySource('subscription') },
    ads, users, disputes, revenue,
  });
});

router.post('/action', authRequired, adminRequired, async (req, res) => {
  const { action, ad_id, application_id, user_id, value, dispute_id, outcome } = req.body || {};
  const ad = ad_id ? db.prepare('SELECT * FROM ads WHERE id = ?').get(ad_id) : null;
  try {
    if (action === 'verify_user') {
      db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(value ? 1 : 0, user_id);
    } else if (action === 'ban_user') {
      db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(value ? 1 : 0, user_id);
    } else if (action === 'refund_ad') {
      if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
      await refundMission(ad, 'remboursé par un administrateur');
    } else if (action === 'pay_ad') {
      if (!ad) return res.status(404).json({ error: 'Mission introuvable' });
      const app = (application_id && db.prepare('SELECT * FROM applications WHERE id = ? AND ad_id = ?').get(application_id, ad.id))
        || db.prepare("SELECT * FROM applications WHERE ad_id = ? AND status IN ('accepted','delivered') LIMIT 1").get(ad.id);
      if (!app) return res.status(400).json({ error: 'Aucun participant à payer' });
      const poster = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
      if (poster.reserved < ad.tip_amount) return res.status(400).json({ error: 'Escrow insuffisant' });
      await settleMission(ad, app);
    } else if (action === 'resolve_dispute') {
      const d = db.prepare('SELECT * FROM disputes WHERE id = ?').get(dispute_id);
      if (!d) return res.status(404).json({ error: 'Litige introuvable' });
      db.prepare("UPDATE disputes SET status = 'resolved' WHERE id = ?").run(dispute_id);
      if (outcome === 'refund') { const a = db.prepare('SELECT * FROM ads WHERE id = ?').get(d.ad_id); if (a) await refundMission(a, 'litige résolu : remboursement'); }
    } else if (action === 'withdraw_commission') {
      const avail = commissionAvailable();
      if (avail <= 0) return res.status(400).json({ error: 'Aucune commission à encaisser' });
      db.prepare('INSERT INTO commission_payouts (id, admin_id, amount) VALUES (?,?,?)').run(nanoid(), req.user.id, avail);
      db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(avail, req.user.id);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
        .run(nanoid(), req.user.id, 'credit', avail, 'Encaissement des commissions Tipper');
    } else {
      return res.status(400).json({ error: 'Action inconnue' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
