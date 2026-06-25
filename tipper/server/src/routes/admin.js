import { Router } from 'express';
import db from '../db.js';
import { authRequired, adminRequired, publicUser } from '../auth.js';

const router = Router();

router.get('/stats', authRequired, adminRequired, (_req, res) => {
  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  const usersCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const missions = db.prepare('SELECT COUNT(*) c FROM ads').get().c;
  const completed = db.prepare("SELECT COUNT(*) c FROM ads WHERE status = 'completed'").get().c;
  const open = db.prepare("SELECT COUNT(*) c FROM ads WHERE status IN ('open','in_progress')").get().c;
  const gmv = db.prepare("SELECT COALESCE(SUM(tip_amount),0) s FROM ads WHERE status = 'completed'").get().s;
  const commission = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM commissions').get().s;
  const disputesOpen = db.prepare("SELECT COUNT(*) c FROM disputes WHERE status = 'open'").get().c;
  const circulating = db.prepare('SELECT COALESCE(SUM(wallet_balance + reserved),0) s FROM users').get().s;

  const ads = db.prepare('SELECT * FROM ads ORDER BY created_at DESC LIMIT 200').all().map((a) => {
    const apps = db.prepare("SELECT COUNT(*) c FROM applications WHERE ad_id = ? AND status != 'rejected'").get(a.id).c;
    const author = db.prepare('SELECT full_name FROM users WHERE id = ?').get(a.user_id);
    return { id: a.id, title: a.title, status: a.status, tip_amount: a.tip_amount, category: a.category,
      author: author?.full_name || '—', applicants: apps, spots_left: Math.max(0, 3 - apps), is_full: apps >= 3, created_at: a.created_at };
  });
  const users = db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT 200').all().map((u) => {
    const p = publicUser(u);
    return { id: u.id, full_name: u.full_name, email: u.email, city: u.city, available: u.wallet_balance, points: u.points || 0, xp: u.xp || 0, verified: !!u.verified, rating: p.rating, rating_count: p.rating_count };
  });
  const disputes = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC LIMIT 100').all().map((d) => {
    const ad = db.prepare('SELECT title FROM ads WHERE id = ?').get(d.ad_id);
    const opener = db.prepare('SELECT full_name FROM users WHERE id = ?').get(d.opener_id);
    return { ...d, ad_title: ad?.title || '—', opener_name: opener?.full_name || '—' };
  });

  res.json({
    kpis: { users: usersCount, missions, completed, open, gmv: r2(gmv), commission: r2(commission), disputes_open: disputesOpen, coins_in_circulation: r2(circulating) },
    ads, users, disputes,
  });
});

export default router;
