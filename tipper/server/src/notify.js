import { nanoid } from 'nanoid';
import db from './db.js';
import { sendPush } from './push.js';

/**
 * Create an in-app notification AND fire a web-push to the user's devices.
 * type examples: new_application, application_accepted, application_rejected,
 *                tip_received, new_message, ad_completed
 */
export async function notify(userId, { type, title, body, data = {} }) {
  const id = nanoid();
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, userId, type, title, body || '', JSON.stringify(data));

  await sendPush(userId, {
    title,
    body: body || '',
    type,
    data: { ...data, notificationId: id },
  });

  return id;
}
