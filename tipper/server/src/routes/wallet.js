import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({ balance: req.user.wallet_balance, transactions: txs });
});

// Recharger le wallet (paiement simulé)
router.post('/topup', authRequired, (req, res) => {
  const amount = parseFloat(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  if (amount > 5000) return res.status(400).json({ error: 'Montant maximum: CHF 5000' });
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'credit', amount, 'Rechargement du wallet');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.wallet_balance, user: publicUser(user) });
});

// Retirer
router.post('/withdraw', authRequired, (req, res) => {
  const amount = parseFloat(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  if (amount > req.user.wallet_balance) return res.status(400).json({ error: 'Solde insuffisant' });
  db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), req.user.id, 'debit', -amount, 'Retrait vers compte bancaire');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.wallet_balance, user: publicUser(user) });
});

export default router;
