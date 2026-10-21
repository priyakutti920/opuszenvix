/**
 * Shared request-hardening helpers for the Opuszyra gateway.
 *
 * Everything here is intentionally permissive about being misconfigured: the
 * rate limiter is bounded in memory and expires on its own, and the admin
 * guard stays open unless an operator explicitly opts in.
 */

// ---------------------------------------------------------------------------
// Upstream timeouts
// ---------------------------------------------------------------------------

// Every upstream call goes through this. Without a budget, a slow or wedged
// upstream pins the request handler for the whole lifetime of the function,
// which on Vercel means burning the function's execution budget on a request
// that can never finish. Callers pass a shorter `timeoutMs` when a local
// fallback already exists (e.g. /v1/models has a static catalog).
export function upstreamTimeoutSignal(timeoutMs) {
  const ms = Number(timeoutMs) > 0 ? Number(timeoutMs) : 60_000;
  return AbortSignal.timeout(ms);
}

// Aborting a fetch that never connected surfaces as TypeError/ABORT_ERR, not
// TimeoutError, so the two are checked separately.
export const isTimeoutError = (err) =>
  err?.name === 'TimeoutError' || err?.code === 'ABORT_ERR';

// ---------------------------------------------------------------------------
// Token redaction
// ---------------------------------------------------------------------------

// Opuszenvix tokens look like `opm-live-<tier>-<16 hex chars>`.
export const OPUSZENVIX_KEY_RE = /opm-live-[0-9a-zA-Z_-]+-[0-9a-fA-F]{8,}/g;
export const OPUSZYRA_KEY_RE = OPUSZENVIX_KEY_RE;

// Anything that is not shaped like an Opuszenvix token is dropped outright.
// Returning a masked fragment of an unrecognised value would still hand an
// attacker the key prefix, which is the half they already have.
//
// The head is 11 characters: that is exactly `opm-live-<tier>` for every tier
// the gateway issues (5x, 20x, 5x_trial, custom), so the tier stays readable
// while the 16 hex characters that identify the key are always removed.
export const redactKeyToken = (value) => {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^(opm-live-[^-]+-)?[0-9a-fA-F]{8,}$/.test(trimmed)) return undefined;
  return `${trimmed.slice(0, 11)}…${trimmed.slice(-4)}`;
};

// ---------------------------------------------------------------------------
// Request rate limiting
// ---------------------------------------------------------------------------

// Sliding-window limiter: `max` requests per `windowMs`, keyed per remote
// address. The gateway forwards to a paid upstream, and nothing in the current
// design accounts for per-client traffic volume, so a single IP could otherwise
// drive unlimited billable requests through it.
export function createRateLimiter({ max, windowMs, keyFn } = {}) {
  if (!Number.isFinite(max) || max < 1) throw new TypeError('max must be a positive number');
  if (!Number.isFinite(windowMs) || windowMs < 1000) {
    throw new TypeError('windowMs must be at least 1000');
  }

  const resolve = keyFn || ((req) => req.ip || req.socket?.remoteAddress || 'unknown');
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    // Opportunistic sweep so a long-lived process does not leak buckets.
    if (buckets.size > 2048) {
      const cutoff = Date.now() - windowMs;
      for (const [key, value] of buckets) {
        if (!value || value.start < cutoff) buckets.delete(key);
      }
    }

    const key = resolve(req) || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, hits: 0 };
      buckets.set(key, bucket);
    }
    bucket.hits += 1;

    const remaining = Math.max(0, max - bucket.hits);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(windowMs / 1000)));

    if (bucket.hits > max) {
      const retryAfterMs = windowMs - (now - bucket.start);
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
      return res.status(429).json({
        type: 'error',
        error: {
          type: 'rate_limit_error',
          message: 'Too many requests. Slow down and retry later.'
        }
      });
    }

    return next();
  };
}

// ---------------------------------------------------------------------------
// Optional admin token (off by default)
// ---------------------------------------------------------------------------

// Admin-protected routes are open unless ADMIN_API_KEY is configured, so the
// existing unauthenticated dashboard keeps working. Once the variable is set,
// the guard becomes mandatory and accepts a shared admin token via
// x-admin-key, or the caller's own valid key token via x-api-key / Bearer.
//
// Header-only on purpose: accepting a credential out of the request body would
// let a valid key embedded in a POST payload authenticate an admin operation
// by accident.
//
// The rejection body is identical in every failure mode — missing header,
// unconfigured variable, and wrong token all produce the same response — so
// the endpoint cannot be used to probe whether ADMIN_API_KEY has been set.
export function adminKeyRequired(supabase) {
  return function adminRequired(req, res, next) {
    if (!(process.env.ADMIN_API_KEY || '').trim()) return next();

    const supplied = req.headers['x-admin-key']
      || req.headers['x-api-key']
      || extractBearer(req.headers['authorization']);

    const candidate = typeof supplied === 'string' ? supplied.trim() : '';
    if (!candidate) return deny(res);
    if (candidate === process.env.ADMIN_API_KEY.trim()) return next();

    return hasValidLocalKey(supabase, candidate)
      .then((ok) => (ok ? next() : deny(res)))
      .catch(() => deny(res));
  };
}

const deny = (res) => res.status(401).json({
  type: 'error',
  error: {
    type: 'authentication_error',
    message: 'Missing or invalid admin credential.'
  }
});

const extractBearer = (header) => {
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

const hasValidLocalKey = async (db, token) => {
  try {
    const { data } = await db.from('api_keys').select('*').eq('key_token', token).maybeSingle();
    return Boolean(data && data.status === 'active');
  } catch {
    return false;
  }
};
