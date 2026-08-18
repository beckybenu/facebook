import webpush from 'web-push';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keysPath = path.join(__dirname, '..', 'data', 'vapid.json');

// Generate and persist VAPID keys on first run so push works out of the box.
let vapid;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
} else if (fs.existsSync(keysPath)) {
  vapid = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
} else {
  vapid = webpush.generateVAPIDKeys();
  fs.writeFileSync(keysPath, JSON.stringify(vapid, null, 2));
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contact@tipper.app',
  vapid.publicKey,
  vapid.privateKey
);

export const VAPID_PUBLIC_KEY = vapid.publicKey;

export function saveSubscription(userId, subscription) {
  // De-dup by endpoint
  const existing = db.prepare('SELECT id, subscription FROM push_subscriptions WHERE user_id = ?').all(userId);
  for (const row of existing) {
    try {
      if (JSON.parse(row.subscription).endpoint === subscription.endpoint) {
        db.prepare('UPDATE push_subscriptions SET subscription = ? WHERE id = ?')
          .run(JSON.stringify(subscription), row.id);
        return;
      }
    } catch { /* ignore malformed rows */ }
  }
  db.prepare('INSERT INTO push_subscriptions (id, user_id, subscription) VALUES (?, ?, ?)')
    .run(nanoid(), userId, JSON.stringify(subscription));
}

export async function sendPush(userId, payload) {
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  await Promise.all(subs.map(async (row) => {
    try {
      await webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify(payload));
    } catch (err) {
      // 404/410 => subscription gone, clean it up
      if (err.statusCode === 404 || err.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(row.id);
      }
    }
  }));
}
