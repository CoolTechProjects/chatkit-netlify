import { getDb, nowIso } from './db.mjs';
import { getSessionCookieName, parseCookies } from './auth.mjs';

export function getUserBySession(req) {
  const cookies = parseCookies(req);
  const token = cookies[getSessionCookieName()];
  if (!token) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.*
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, nowIso());

  if (!row) return null;
  return { token, user: row };
}
