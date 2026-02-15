const windows = new Map();

export function enforceRateLimit(key, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now > current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  return { allowed: true };
}

export function clientIp(req) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}
