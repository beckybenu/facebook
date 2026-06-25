import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'tipper.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  avatar        TEXT,
  bio           TEXT,
  wallet_balance REAL NOT NULL DEFAULT 0,   -- Tipper Coins disponibles
  reserved      REAL NOT NULL DEFAULT 0,    -- bloqué en séquestre
  points        INTEGER NOT NULL DEFAULT 0, -- Tipper Points (consolation)
  xp            INTEGER NOT NULL DEFAULT 0,
  verified      INTEGER NOT NULL DEFAULT 0,
  rating_sum    REAL NOT NULL DEFAULT 0,
  rating_count  INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT,
  referred_by   TEXT,
  banned        INTEGER NOT NULL DEFAULT 0,
  pro_until     TEXT,
  lat           REAL,
  lng           REAL,
  city          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ads (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  price       REAL,
  tip_amount  REAL NOT NULL DEFAULT 0,
  photo       TEXT,
  description TEXT,
  lat         REAL,
  lng         REAL,
  city        TEXT,
  kind         TEXT NOT NULL DEFAULT 'standard', -- standard | instant | quest
  urgent       INTEGER NOT NULL DEFAULT 0,
  scheduled_at TEXT,
  boosted_until TEXT,
  delivered_app TEXT,
  status      TEXT NOT NULL DEFAULT 'open', -- open | in_progress | delivered | completed | cancelled
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id          TEXT PRIMARY KEY,
  ad_id       TEXT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | completed
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(ad_id, user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- credit | debit | tip_in | tip_out
  amount      REAL NOT NULL,
  description TEXT,
  ad_id       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        TEXT,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  ad_id       TEXT REFERENCES ads(id) ON DELETE CASCADE,
  sender_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription  TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  ad_id      TEXT,
  rater_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'helper', -- helper | poster
  stars      INTEGER NOT NULL,
  comment    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_ads (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id      TEXT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, ad_id)
);

CREATE TABLE IF NOT EXISTS commissions (
  id         TEXT PRIMARY KEY,
  ad_id      TEXT,
  amount     REAL NOT NULL,
  source     TEXT NOT NULL DEFAULT 'commission', -- commission | boost | subscription
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id         TEXT PRIMARY KEY,
  admin_id   TEXT,
  amount     REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disputes (
  id         TEXT PRIMARY KEY,
  ad_id      TEXT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  opener_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open', -- open | resolved
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_apps_ad ON applications(ad_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ratee ON reviews(ratee_id);
`);

// Migrations défensives (bases existantes) : ajoute les colonnes manquantes
function ensureColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${def}`);
}
ensureColumn('users', 'reserved', 'reserved REAL NOT NULL DEFAULT 0');
ensureColumn('users', 'points', 'points INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'xp', 'xp INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'verified', 'verified INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'rating_sum', 'rating_sum REAL NOT NULL DEFAULT 0');
ensureColumn('users', 'rating_count', 'rating_count INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'referral_code', 'referral_code TEXT');
ensureColumn('users', 'referred_by', 'referred_by TEXT');
ensureColumn('users', 'banned', 'banned INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'pro_until', 'pro_until TEXT');
ensureColumn('ads', 'kind', "kind TEXT NOT NULL DEFAULT 'standard'");
ensureColumn('ads', 'boosted_until', 'boosted_until TEXT');
ensureColumn('ads', 'urgent', 'urgent INTEGER NOT NULL DEFAULT 0');
ensureColumn('commissions', 'source', "source TEXT NOT NULL DEFAULT 'commission'");
ensureColumn('ads', 'scheduled_at', 'scheduled_at TEXT');
ensureColumn('ads', 'delivered_app', 'delivered_app TEXT');

export default db;
