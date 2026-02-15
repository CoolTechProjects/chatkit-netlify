import { getDb, nowIso, plusHoursIso } from './_lib/db.mjs';
import { badMethod, json, readJson } from './_lib/http.mjs';
import { verifyPassword, createSessionToken, buildSessionCookie, isSecureRequest } from './_lib/auth.mjs';
import { clientIp, enforceRateLimit } from './_lib/rate-limit.mjs';

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const limiter = enforceRateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limiter.allowed) return json({ error: 'Za duzo prob logowania. Sprobuj pozniej.' }, 429);

  const { email, password } = await readJson(req);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return json({ error: 'Niepoprawny email lub haslo.' }, 401);
  }

  const token = createSessionToken();
  db.prepare('INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    user.id,
    token,
    nowIso(),
    plusHoursIso(24 * 30)
  );

  return json(
    { ok: true, redirectTo: '/chat' },
    200,
    { 'Set-Cookie': buildSessionCookie(token, isSecureRequest(req)) }
  );
};
