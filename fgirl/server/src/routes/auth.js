import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, displayName, role } = req.body || {};
  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: 'email, password, displayName and role are required' });
  }
  if (!['client', 'provider'].includes(role)) {
    return res.status(400).json({ error: 'role must be client or provider' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, role, display_name) VALUES (?,?,?,?)')
    .run(email.toLowerCase(), hash, role, displayName);

  const user = db.prepare('SELECT id, email, role, display_name FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, role, display_name FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(user.id);
  res.json({ user: { ...publicUser(user), profileId: profile?.id ?? null } });
});

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, displayName: user.display_name };
}

export default router;
