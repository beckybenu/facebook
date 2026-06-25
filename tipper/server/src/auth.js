import jwt from 'jsonwebtoken';
import db from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'tipper-dev-secret-change-me';

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'beckybenu@gmail.com,admin@tipper.app')
  .split(',').map((e) => e.trim().toLowerCase());
export const isAdminEmail = (e) => ADMIN_EMAILS.includes((e || '').toLowerCase());

export function adminRequired(req, res, next) {
  if (!isAdminEmail(req.user?.email)) return res.status(403).json({ error: 'Accès réservé à l\'administrateur' });
  next();
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    if (user.banned && !isAdminEmail(user.email)) return res.status(403).json({ error: 'Compte suspendu' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
  }
}

export const LEVELS = [
  { min: 0, name: 'Nouveau', emoji: '🌱' },
  { min: 100, name: 'Bronze', emoji: '🥉' },
  { min: 300, name: 'Argent', emoji: '🥈' },
  { min: 700, name: 'Or', emoji: '🥇' },
  { min: 1500, name: 'Platine', emoji: '💎' },
  { min: 3000, name: 'Légende', emoji: '👑' },
];
export function levelInfo(xp = 0) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx]; const next = LEVELS[idx + 1];
  const progress = next ? Math.min(1, (xp - cur.min) / (next.min - cur.min)) : 1;
  return { index: idx, ...cur, next, progress, xp };
}
const ratingOf = (u) => (u.rating_count ? Math.round((u.rating_sum / u.rating_count) * 10) / 10 : null);

function badgesOf(u) {
  const b = [];
  if (u.verified) b.push({ key: 'verified', label: 'Vérifié', emoji: '✅' });
  const completed = db.prepare("SELECT COUNT(*) c FROM applications WHERE user_id = ? AND status = 'completed'").get(u.id).c;
  const posted = db.prepare('SELECT COUNT(*) c FROM ads WHERE user_id = ?').get(u.id).c;
  const r = ratingOf(u);
  if (completed >= 3) b.push({ key: 'helper', label: 'Super Helper', emoji: '🦸' });
  if (posted >= 3) b.push({ key: 'tipper', label: 'Top Tipper', emoji: '💸' });
  if (r != null && r >= 4.8 && u.rating_count >= 3) b.push({ key: 'fivestar', label: '5 étoiles', emoji: '⭐' });
  if (levelInfo(u.xp).index >= 4) b.push({ key: 'legend', label: 'Élite', emoji: '👑' });
  return b;
}

export function publicUser(u, { withBadges = true } = {}) {
  if (!u) return null;
  const saved = db.prepare('SELECT ad_id FROM saved_ads WHERE user_id = ?').all(u.id).map((r) => r.ad_id);
  return {
    id: u.id, email: u.email, full_name: u.full_name, avatar: u.avatar, bio: u.bio,
    available: u.wallet_balance, reserved: u.reserved || 0, points: u.points || 0, wallet_balance: u.wallet_balance,
    lat: u.lat, lng: u.lng, city: u.city, created_at: u.created_at, verified: !!u.verified,
    xp: u.xp || 0, level: levelInfo(u.xp || 0), rating: ratingOf(u), rating_count: u.rating_count || 0,
    badges: withBadges ? badgesOf(u) : [], saved, referral_code: u.referral_code,
    is_admin: isAdminEmail(u.email),
    pro: isPro(u), pro_until: u.pro_until || null,
    kyc_status: u.kyc_status || 'none', kyc_doc_type: u.kyc_doc_type || null,
  };
}

export function addXp(userId, amount) {
  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(amount, userId);
}

export const isPro = (u) => !!(u && u.pro_until && new Date(u.pro_until) > new Date());
export const isBoosted = (ad) => !!(ad && ad.boosted_until && new Date(ad.boosted_until) > new Date());

import { nanoid as _nano } from 'nanoid';
export function addRevenue(amount, source, ad_id) {
  db.prepare('INSERT INTO commissions (id, ad_id, amount, source) VALUES (?,?,?,?)').run(_nano(), ad_id || null, amount, source);
}
