import { Router } from 'express';
import db from '../db.js';
import { authRequired, publicUser } from '../auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { scope } = req.query;
  let rows;
  if (scope === 'city' && req.user.city) {
    rows = db.prepare('SELECT * FROM users WHERE city = ? ORDER BY xp DESC LIMIT 50').all(req.user.city);
  } else {
    rows = db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT 50').all();
  }
  const leaderboard = rows.map((u, i) => ({ rank: i + 1, ...publicUser(u), is_me: u.id === req.user.id }));
  res.json({ leaderboard, me_rank: leaderboard.find((r) => r.is_me)?.rank });
});

export default router;
