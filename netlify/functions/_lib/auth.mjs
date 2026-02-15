import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'chatkit_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = (storedHash || '').split(':');
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  if (original.length !== computed.length) return false;
  return timingSafeEqual(original, computed);
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export function parseCookies(req) {
  const header = req.headers.get('cookie') || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

export function buildSessionCookie(token, isSecure) {
  const base = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
  return isSecure ? `${base}; Secure` : base;
}

export function buildLogoutCookie(isSecure) {
  const base = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  return isSecure ? `${base}; Secure` : base;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function isSecureRequest(req) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return proto === 'https';
}
