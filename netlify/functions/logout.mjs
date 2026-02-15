import { getDb } from './_lib/db.mjs';
import { badMethod, json } from './_lib/http.mjs';
import { buildLogoutCookie, getSessionCookieName, isSecureRequest, parseCookies } from './_lib/auth.mjs';

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const db = getDb();
  const token = parseCookies(req)[getSessionCookieName()];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  return json({ ok: true }, 200, { 'Set-Cookie': buildLogoutCookie(isSecureRequest(req)) });
};
