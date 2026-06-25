import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser, addRevenue, isPro } from '../auth.js';

export const POINTS_PER_COIN = 10;
const PRO_PRICE = 49;
const router = Router();

// Abonnement Tipper Pro (30 jours) — revenu récurrent plateforme
router.post('/pro', authRequired, (req, res) => {
  if (req.user.wallet_balance < PRO_PRICE) return res.status(400).json({ error: `Solde insuffisant (${PRO_PRICE} 🪙 requis)` });
  const base = isPro(req.user) ? new Date(req.user.pro_until) : new Date();
  const until = new Date(base.getTime() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare('UPDATE users SET wallet_balance = wallet_balance - ?, pro_until = ? WHERE id = ?').run(PRO_PRICE, until, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'subscription', -PRO_PRICE, 'Abonnement Tipper Pro (30 jours)');
  addRevenue(PRO_PRICE, 'subscription', null);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

// Stripe optionnel : activé seulement si la clé secrète est fournie
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = (await import('stripe')).default;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}
export const stripeEnabled = () => !!stripe;

router.get('/', authRequired, (req, res) => {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({
    available: req.user.wallet_balance, reserved: req.user.reserved || 0,
    points: req.user.points || 0, points_per_coin: POINTS_PER_COIN,
    balance: req.user.wallet_balance, total: req.user.wallet_balance + (req.user.reserved || 0),
    transactions: txs, stripe: stripeEnabled(),
  });
});

// Achat de Coins : Stripe si configuré, sinon crédit direct (simulé)
router.post('/topup', authRequired, (req, res) => {
  const amount = parseFloat(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  if (amount > 5000) return res.status(400).json({ error: 'Maximum CHF 5000' });
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'credit', amount, 'Achat de Tipper Coins');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.wallet_balance, available: user.wallet_balance, user: publicUser(user) });
});

// Crée une session de paiement Stripe (1 CHF = 1 Coin)
router.post('/checkout', authRequired, async (req, res) => {
  if (!stripe) return res.status(400).json({ error: 'Stripe non configuré', simulated: true });
  const amount = parseFloat(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: { currency: 'chf', product_data: { name: `${amount} Tipper Coins 🪙` }, unit_amount: Math.round(amount * 100) },
      quantity: 1,
    }],
    metadata: { user_id: req.user.id, coins: String(amount) },
    success_url: `${origin}/wallet?paid=1`,
    cancel_url: `${origin}/wallet`,
  });
  res.json({ url: session.url });
});

// Échange Tipper Points -> Coins
router.post('/exchange', authRequired, (req, res) => {
  const coins = Math.floor(parseFloat(req.body && req.body.coins) || 0);
  if (coins <= 0) return res.status(400).json({ error: 'Nombre de Coins invalide' });
  const cost = coins * POINTS_PER_COIN;
  if ((req.user.points || 0) < cost) return res.status(400).json({ error: `Pas assez de Tipper Points (${cost} requis)` });
  db.prepare('UPDATE users SET points = points - ?, wallet_balance = wallet_balance + ? WHERE id = ?').run(cost, coins, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'points_exchange', coins, `Échange de ${cost} Tipper Points`);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ available: user.wallet_balance, points: user.points, user: publicUser(user) });
});

router.post('/withdraw', authRequired, (req, res) => {
  const amount = parseFloat(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  if (amount > req.user.wallet_balance) return res.status(400).json({ error: 'Solde insuffisant' });
  db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'debit', -amount, 'Retrait');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.wallet_balance, available: user.wallet_balance, user: publicUser(user) });
});

// Crédite les Coins après paiement Stripe confirmé (appelé par le webhook)
export function creditFromStripe(session) {
  const userId = session.metadata?.user_id;
  const coins = parseFloat(session.metadata?.coins);
  if (!userId || !coins) return;
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(coins, userId);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), userId, 'credit', coins, 'Achat de Tipper Coins (Stripe)');
}

export { stripe };
export default router;
