import { getDb, nowIso, plusHoursIso } from './_lib/db.mjs';
import { badMethod, json, readJson } from './_lib/http.mjs';
import { hashPassword, createSessionToken, buildSessionCookie, isSecureRequest } from './_lib/auth.mjs';
import { clientIp, enforceRateLimit } from './_lib/rate-limit.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const limiter = enforceRateLimit(`register:${clientIp(req)}`, 8, 15 * 60 * 1000);
  if (!limiter.allowed) return json({ error: 'Za duzo prob. Sprobuj ponownie pozniej.' }, 429);

  const { email, password } = await readJson(req);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(normalizedEmail)) return json({ error: 'Podaj poprawny email.' }, 400);
  if (typeof password !== 'string' || password.length < 8) {
    return json({ error: 'Haslo musi miec minimum 8 znakow.' }, 400);
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return json({ error: 'Konto z tym emailem juz istnieje.' }, 409);

  const createdAt = nowIso();
  const trialExpiresAt = plusHoursIso(24);
  const passwordHash = hashPassword(password);

  const insert = db.prepare(
    `INSERT INTO users (email, password_hash, created_at, trial_started_at, trial_expires_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = insert.run(normalizedEmail, passwordHash, createdAt, createdAt, trialExpiresAt);
  const userId = result.lastInsertRowid;

  const token = createSessionToken();
  db.prepare('INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    userId,
    token,
    createdAt,
    plusHoursIso(24 * 30)
  );

  return json(
    { ok: true, redirectTo: '/chat' },
    201,
    { 'Set-Cookie': buildSessionCookie(token, isSecureRequest(req)) }
  );
};
