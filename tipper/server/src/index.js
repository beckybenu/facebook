import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import applicationsRoutes from './routes/applications.js';
import walletRoutes, { stripe, creditFromStripe } from './routes/wallet.js';
import notificationsRoutes from './routes/notifications.js';
import messagesRoutes from './routes/messages.js';
import usersRoutes from './routes/users.js';
import reviewsRoutes from './routes/reviews.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { JWT_SECRET } from './auth.js';
import { addClient } from './sse.js';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Webhook Stripe : doit recevoir le corps brut (avant express.json)
app.post('/api/wallet/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) return res.status(400).end();
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') creditFromStripe(event.data.object);
  res.json({ received: true });
});

app.use(express.json({ limit: '2mb' }));

// Flux temps réel (SSE). EventSource ne pose pas d'en-tête -> token en query.
app.get('/api/stream', (req, res) => {
  let userId;
  try { userId = jwt.verify(req.query.token, JWT_SECRET).id; } catch { return res.status(401).end(); }
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) return res.status(401).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders?.();
  res.write('event: ready\ndata: {}\n\n');
  addClient(userId, res);
  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* ignore */ } }, 25000);
  req.on('close', () => clearInterval(ping));
});

// Fichiers uploadés (photos d'annonces)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'Tipper API' }));

app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Servir le frontend buildé en production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Gestion d'erreurs
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`✅ Tipper API démarrée sur http://localhost:${PORT}`);
});
