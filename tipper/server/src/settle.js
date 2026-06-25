import { nanoid } from 'nanoid';
import db from './db.js';
import { addXp, isPro } from './auth.js';
import { notify } from './notify.js';

export const COMMISSION = 0.10;
export const PRO_COMMISSION = 0.05;
export const CONSOLATION_POINTS = 10;

// Règlement d'une mission : commission (5% Pro / 10%), net au helper, consolation.
export async function settleMission(ad, app) {
  const poster = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  const rate = isPro(poster) ? PRO_COMMISSION : COMMISSION;
  const commission = Math.round(ad.tip_amount * rate * 100) / 100;
  const net = Math.round((ad.tip_amount - commission) * 100) / 100;
  const others = db.prepare('SELECT * FROM applications WHERE ad_id = ? AND user_id != ?').all(ad.id, app.user_id);

  db.transaction(() => {
    db.prepare('UPDATE users SET reserved = reserved - ? WHERE id = ?').run(ad.tip_amount, poster.id);
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(net, app.user_id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), poster.id, 'tip_out', -ad.tip_amount, `Pourboire versé · ${ad.title}`, ad.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), app.user_id, 'tip_in', net, `Pourboire reçu (–${Math.round(rate * 100)}% commission) · ${ad.title}`, ad.id);
    db.prepare("INSERT INTO commissions (id, ad_id, amount, source) VALUES (?,?,?,'commission')").run(nanoid(), ad.id, commission);
    db.prepare("UPDATE applications SET status = 'completed' WHERE id = ?").run(app.id);
    db.prepare("UPDATE ads SET status = 'completed' WHERE id = ?").run(ad.id);
    addXp(app.user_id, 50); addXp(poster.id, 15);
    for (const o of others) {
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(CONSOLATION_POINTS, o.user_id);
      if (['pending', 'accepted', 'delivered'].includes(o.status)) db.prepare("UPDATE applications SET status = 'rejected' WHERE id = ?").run(o.id);
    }
  })();

  await notify(app.user_id, { type: 'tip_received', title: '💰 Pourboire reçu !', body: `${net} 🪙 crédités (après 10% de commission) pour « ${ad.title} ». +50 XP !`, data: { adId: ad.id, review: true, rateeId: poster.id } });
  for (const o of others) await notify(o.user_id, { type: 'points_earned', title: `🎯 +${CONSOLATION_POINTS} Tipper Points`, body: `Mission « ${ad.title} » attribuée, mais voici ${CONSOLATION_POINTS} points à échanger !`, data: { adId: ad.id } });
  return { net, commission };
}

export async function refundMission(ad, reason) {
  const poster = db.prepare('SELECT * FROM users WHERE id = ?').get(ad.user_id);
  if (poster && poster.reserved >= ad.tip_amount && ad.status !== 'completed') {
    db.prepare('UPDATE users SET reserved = reserved - ?, wallet_balance = wallet_balance + ? WHERE id = ?').run(ad.tip_amount, ad.tip_amount, poster.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description, ad_id) VALUES (?,?,?,?,?,?)')
      .run(nanoid(), poster.id, 'escrow_refund', ad.tip_amount, `Pourboire remboursé · ${ad.title}`, ad.id);
    if (reason) await notify(poster.id, { type: 'dispute', title: '↩️ Remboursement', body: `« ${ad.title} » : ${reason}`, data: { adId: ad.id } });
  }
  db.prepare("UPDATE ads SET status = 'cancelled' WHERE id = ?").run(ad.id);
}
