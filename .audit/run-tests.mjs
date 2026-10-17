/**
 * OpusZyra Phase 2 security & API-reliability test harness.
 *
 * Boots the real Express app on a random local port and points its
 * UPSTREAM_API_BASE at a fake origin, while globalThis.fetch is replaced with a
 * mock. That means the suite exercises the real middleware, routing, rate
 * limiter, auth gate and quota checks, but never sends a real paid request
 * upstream and never touches a production service. The in-memory mock Supabase
 * database is used because no SUPABASE_* variables are set.
 *
 * Usage: node .audit/run-tests.mjs
 */

process.env.NODE_ENV = 'test';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.UPSTREAM_API_KEY;
delete process.env.ADMIN_API_KEY;
process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
process.env.REQUEST_BODY_LIMIT = '5mb';

const results = [];
let passed = 0;
let failed = 0;
const failures = [];

// Capture the real fetch BEFORE the mock is installed, otherwise the harness's
// own calls to the local server would be swallowed by the mock.
const realFetch = globalThis.fetch.bind(globalThis);

const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  if (ok) passed++;
  else { failed++; failures.push({ name, detail }); }
};
const check = (name, cond, detail = '') => record(name, Boolean(cond), detail);

// ---------------------------------------------------------------------------
// Upstream mock
// ---------------------------------------------------------------------------
const fetchLog = [];

const jsonResponse = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers({ 'content-type': 'application/json', ...headers }),
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  body: null
});

// Timeout probe: a request whose only purpose is to establish that a route
// answers 200 within the timeout budget. It must look like success, not like
// the upstream-failure mode the later sections deliberately inject.
const timeoutOk = () => jsonResponse(200, { status: 'ok', data: [] });
// Failure probe: the same shape but with the timeout budget already exhausted.
const timeoutErr = () => { throw new DOMException('The operation timed out.', 'TimeoutError'); };

let upstreamBehavior = () => jsonResponse(200, { ok: true });

const mockFetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  fetchLog.push(url);

  // An already-aborted signal means the timeout budget was exhausted, which is
  // exactly what the timeout-handling tests want to simulate.
  if (init.signal?.aborted) {
    throw new DOMException('The operation timed out.', 'TimeoutError');
  }
  return upstreamBehavior(url, init);
};
globalThis.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Boot the app under test
// ---------------------------------------------------------------------------
const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');
const { createRateLimiter, redactKeyToken } = await import('../server/lib/security.js');

const http = await import('node:http');
const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const get = async (path, opts) => {
  const res = await realFetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { res, text, json };
};

// Capture morgan output for the log-leak tests.
let captured = '';
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => { captured += String(chunk); return origWrite(chunk, ...rest); };

// Seeded demo keys from server/lib/supabase.js.
const KEY_5X = 'opm-live-5x-9f8a3c2e1b4d7f0a';
const KEY_20X = 'opm-live-20x-8d7e6f5c4b3a2109';

// Insert a fresh 5x key with an unconsumed window, so the quota check passes
// and a valid authenticated request can reach the (mocked) upstream.
const insertFreshKey = async () => {
  const crypto = await import('node:crypto');
  const id = crypto.randomUUID();
  const token = `opm-live-5x-${crypto.randomBytes(12).toString('hex')}`;
  await supabase.from('api_keys').insert({
    id, key_token: token, tier: '5x', status: 'active',
    name: 'Test key', key_prefix: 'opm-live-5x',
    rate_limit_rpm: 60, rate_limit_tpm: 400000,
    window_token_limit: 25000000, window_tokens_used: 0,
    window_started_at: new Date().toISOString(),
    window_resets_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    total_tokens_consumed: 0, total_requests: 0,
    created_at: new Date().toISOString()
  });
  return token;
};

// Force the 5-hour rolling window to be exhausted for the seeded 5x key, so
// quota enforcement can be asserted without consuming real capacity.
let blockQuota = false;
const seedQuotaExhaustion = async () => {
  const { data } = await supabase.from('api_keys').select('*').eq('key_token', KEY_5X).maybeSingle();
  if (!data) throw new Error('seeded 5x key not found');
  await supabase.from('api_keys').update({ window_tokens_used: data.window_token_limit }).eq('id', data.id);
  blockQuota = true;
};

// ===========================================================================
// SECTION 1 — Mock persistence layer (F1)
// ===========================================================================
{
  const chain = supabase.from('api_keys').select('*').eq('key_token', KEY_5X);
  check('F1 mock DB exposes maybeSingle', typeof chain.maybeSingle === 'function');
  const r = await chain.maybeSingle();
  check('F1 maybeSingle returns the seeded key', r.error === null && r.data?.key_token === KEY_5X);
  const miss = await supabase.from('api_keys').select('*').eq('key_token', 'opm-live-5x-0000000000000000').maybeSingle();
  check('F1 maybeSingle returns null on a miss without throwing', miss.error === null && miss.data === null);
}

// ===========================================================================
// SECTION 2 — Authentication on the completion proxy (F2)
// ===========================================================================
{
  const body = JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] });
  const noKey = await get('/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  check('F2 /v1/messages without a key -> 401', noKey.res.status === 401, `got ${noKey.res.status}`);
  check('F2 401 body does not echo a key value', !/opm-live/.test(noKey.text));

  const oa = await get('/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  check('F2 /v1/chat/completions without a key -> 401', oa.res.status === 401, `got ${oa.res.status}`);

  // A keyless request must not have been forwarded upstream.
  check('F2 keyless request never reaches upstream', fetchLog.filter((u) => u.includes('/v1/messages')).length === 0,
    JSON.stringify(fetchLog));
}

// ===========================================================================
// SECTION 3 — Valid request still proxies (R1)
// Must run before the rate-limit section: it needs a clean per-IP window.
// ===========================================================================
{
  upstreamBehavior = () => jsonResponse(200, {
    id: 'msg_01', type: 'message', role: 'assistant',
    content: [{ type: 'text', text: 'hello' }],
    usage: { input_tokens: 12, output_tokens: 34 }
  });
  const token = await insertFreshKey();
  const ok = await get('/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': token },
    body: JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'ping' }] })
  });
  check('R1 valid authenticated request still proxies through', ok.res.status === 200 && ok.json?.content?.[0]?.text === 'hello',
    `got ${ok.res.status} ${ok.text.slice(0, 120)}`);
  check('R1 upstream received the call', fetchLog.some((u) => u.includes('/v1/messages')), JSON.stringify(fetchLog));
}

// ===========================================================================
// SECTION 4 — Upstream error sanitisation (F3)
// ===========================================================================
{
  const H = { 'content-type': 'application/json', 'x-api-key': KEY_20X };
  const body = JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] });
  const LEAK = 'sk-ant-master-secret-DO-NOT-LEAK';

  upstreamBehavior = () => jsonResponse(401, {
    type: 'error',
    error: { type: 'authentication_error', message: `Authorization failed for credential ${LEAK}` }
  });
  const leaky = await get('/v1/messages', { method: 'POST', headers: H, body });
  check('F3 preserves the upstream status code', leaky.res.status === 401, `got ${leaky.res.status}`);
  check('F3 keeps the machine-readable error type', leaky.json?.error?.type === 'authentication_error', leaky.text.slice(0, 140));
  check('F3 upstream error body is sanitised (no credential echo)', !leaky.text.includes(LEAK), leaky.text.slice(0, 160));
  check('F3 error message is generic', /failed/i.test(leaky.json?.error?.message || ''), leaky.json?.error?.message);

  upstreamBehavior = () => jsonResponse(500, '<html><body>panic: /srv/app/secrets.env</body></html>', { 'content-type': 'text/html' });
  const htmlErr = await get('/v1/messages', { method: 'POST', headers: H, body });
  check('F3 non-JSON upstream error becomes JSON', htmlErr.json !== null, htmlErr.text.slice(0, 120));
  check('F3 non-JSON upstream error does not pass raw HTML through', !/<html/i.test(htmlErr.text));
  check('F3 non-JSON upstream error does not leak internal paths', !/secrets\.env/.test(htmlErr.text), htmlErr.text.slice(0, 160));
}

// ===========================================================================
// SECTION 5 — Upstream timeout handling (F4)
// ===========================================================================
{
  const H = { 'content-type': 'application/json', 'x-api-key': KEY_20X };
  const body = JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] });

  upstreamBehavior = () => { throw new DOMException('The operation timed out.', 'TimeoutError'); };
  const t = await get('/v1/messages', { method: 'POST', headers: H, body });
  check('F4 upstream timeout -> 504', t.res.status === 504, `got ${t.res.status}`);
  check('F4 timeout message is generic', /timed out/i.test(t.text), t.text.slice(0, 160));
  check('F4 timeout message does not leak the upstream host', !t.text.includes('upstream.test.local'));

  upstreamBehavior = () => { const e = new TypeError('fetch failed'); e.code = 'ABORT_ERR'; throw e; };
  const ab = await get('/v1/messages', { method: 'POST', headers: H, body });
  check('F4 aborted connection -> 504', ab.res.status === 504, `got ${ab.res.status}`);
  check('F4 abort message does not leak internals', !/fetch failed/.test(ab.text), ab.text.slice(0, 160));
}

// ===========================================================================
// SECTION 6 — Malformed JSON handling (F5)
// ===========================================================================
{
  const bad = await get('/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY_20X },
    body: '{"model":"claude-3-7-sonnet-20250219","messages":[{"role":"user","content":"hi"'
  });
  check('F5 malformed JSON -> 400', bad.res.status === 400, `got ${bad.res.status}`);
  check('F5 malformed JSON returns JSON, not a stack trace', bad.json !== null && !/at .*server|Error: Unexpected/.test(bad.text), bad.text.slice(0, 160));
}

// ===========================================================================
// SECTION 7 — Request size limits (F6)
// ===========================================================================
{
  const H = { 'content-type': 'application/json', 'x-api-key': KEY_20X };
  const big = JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'x'.repeat(6 * 1024 * 1024) }] });
  const over = await get('/v1/messages', { method: 'POST', headers: H, body: big });
  check('F6 6MB body is rejected with 413', over.res.status === 413, `got ${over.res.status}`);
  check('F6 oversize response stays generic', !/entity\.too\.large|Too big|payload too large/i.test(over.text), over.text.slice(0, 160));
}

// ===========================================================================
// SECTION 8 — Health, stats and SPA fallback (R2-R4, R6-R7)
// ===========================================================================
{
  const health = await get('/api/health');
  check('R2 /api/health unchanged', health.res.status === 200 && health.json?.status === 'online', `got ${health.res.status}`);

  const overview = await get('/api/stats/overview');
  check('R3 /api/stats/overview unchanged', overview.res.status === 200 && overview.json?.stats !== undefined, `got ${overview.res.status}`);

  const logs = await get('/api/stats/logs');
  check('R4 /api/stats/logs unchanged', logs.res.status === 200 && Array.isArray(logs.json?.logs), `got ${logs.res.status}`);

  const spa = await get('/some/unknown/client-route');
  check('R6 non-API routes still fall through to the SPA (no JSON 404)', spa.res.status !== 404, `got ${spa.res.status}`);

  const json404 = await get('/api/nope');
  check('R7 unknown /api route returns a JSON 404', json404.res.status === 404 && json404.json?.status === 404, `got ${json404.res.status}`);
}

// ===========================================================================
// SECTION 9 — Upstream timeouts outside the proxy (R5, R8)
// ===========================================================================
{
  upstreamBehavior = () => { throw new DOMException('The operation timed out.', 'TimeoutError'); };

  const st = await get('/api/status');
  check('R5 /api/status still resolves when the upstream is down', st.res.status === 200, `got ${st.res.status}`);
  check('R5 /api/status falls back to local status data', st.json?.status === 'ok' || st.json?.overall === 'operational', JSON.stringify(st.json).slice(0, 120));

  // A local record exists for the seeded key, so the route must answer from
  // local data even though the upstream lookup is failing.
  const dbgRows = supabase.apiKeys.length;
  const dbgDirect = await supabase.from('api_keys').select('*').eq('key_token', KEY_20X).maybeSingle();
  const kd = await get(`/api/key-status?key=${KEY_20X}`);
  check('R5 /api/key-status still resolves when the upstream is down', kd.res.status === 200, `got ${kd.res.status}`);
  check('R5 /api/key-status serves the seeded key from local data', kd.json?.key?.key_token === KEY_20X, JSON.stringify(kd.json).slice(0, 120));

  upstreamBehavior = () => jsonResponse(200, { data: [{ id: 'm1' }], has_more: false });
  const md = await get('/v1/models');
  check('R8 /v1/models forwards an upstream listing', md.res.status === 200 && Array.isArray(md.json?.data) && md.json.data.some((m) => m.id === 'm1'), `got ${md.res.status}`);

  upstreamBehavior = () => { throw new DOMException('The operation timed out.', 'TimeoutError'); };
  const mf = await get('/v1/models');
  check('R8 /v1/models falls back to the local catalog on timeout', mf.res.status === 200 && Array.isArray(mf.json?.data) && mf.json.data.length > 0, `got ${mf.res.status}`);
}

// ===========================================================================
// SECTION 10 — Request payload validation (F7)
// ===========================================================================
{
  const H = { 'content-type': 'application/json', 'x-api-key': KEY_20X };
  for (const bad of [null, {}, 'not-an-array', [], [1, 2, 3], [{ content: 'no role' }]]) {
    const payload = bad === null
      ? { model: 'claude-3-7-sonnet-20250219' }
      : { model: 'claude-3-7-sonnet-20250219', messages: bad };
    const r = await get('/v1/messages', { method: 'POST', headers: H, body: JSON.stringify(payload) });
    check(`F7 rejects messages=${JSON.stringify(bad).slice(0, 24)} -> 400`, r.res.status === 400, `got ${r.res.status}`);
  }
}

// ===========================================================================
// ===========================================================================
// SECTION 11 — Quota enforcement (R9)
// (Run before the per-IP limiter burst so the remote address is not yet blocked)
// ===========================================================================
{
  await seedQuotaExhaustion();
  const H = { 'content-type': 'application/json', 'x-api-key': KEY_5X };
  const r = await get('/v1/messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] })
  });
  check('R9 exhausted 5h window still yields 429', r.res.status === 429, `got ${r.res.status}`);
  check('R9 quota error message is preserved', /5-hour window capacity exceeded/i.test(r.text), r.text.slice(0, 160));
}

// ===========================================================================
// SECTION 12 — Rate limiting (F8)
// Runs after all valid requests above, so the per-IP window can be exhausted.
// ===========================================================================
{
  const H = { 'content-type': 'application/json' };
  const body = JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] });

  let statuses = [];
  for (let i = 0; i < 65; i++) {
    const r = await get('/v1/messages', { method: 'POST', headers: H, body });
    statuses.push(r.res.status);
  }
  const limited = statuses.filter((s) => s === 429).length;
  check('F8 per-IP rate limit engages within 65 requests', limited > 0, `429s seen: ${limited}`);
  check('F8 first request of the burst was not blocked', statuses[0] === 401, `first: ${statuses[0]}`);

  const blocked = await get('/v1/messages', { method: 'POST', headers: H, body });
  check('F8 blocked response uses the 429 rate_limit_error envelope',
    blocked.res.status === 429 && blocked.json?.error?.type === 'rate_limit_error',
    `status=${blocked.res.status} ${blocked.text.slice(0, 120)}`);
  check('F8 blocked response advertises Retry-After', !!blocked.res.headers.get('retry-after'), blocked.res.headers.get('retry-after'));

  // Unit-test the limiter in isolation for exact semantics.
  const rl = createRateLimiter({ max: 10, windowMs: 60_000 });
  const lastHeaders = {};
  let nextCalls = 0;
  let blockedCount = 0;
  for (let i = 0; i < 13; i++) {
    const h = {};
    const res = {
      status(c) { h.status = c; return this; },
      setHeader(k, v) { h[k] = v; return this; },
      json() { return h; }
    };
    rl({ ip: '10.0.0.1' }, res, () => { nextCalls++; });
    if (h.status === 429) blockedCount++;
    if (i === 0) Object.assign(lastHeaders, h);
  }
  check('F8 limiter allows exactly the first `max` requests', nextCalls === 10, `next calls: ${nextCalls}`);
  check('F8 limiter blocks the rest with 429', blockedCount === 3, `blocked: ${blockedCount}`);
  check('F8 limiter emits RateLimit-Remaining', typeof lastHeaders['RateLimit-Remaining'] === 'string', lastHeaders['RateLimit-Remaining']);
  check('F8 limiter emits RateLimit-Limit', lastHeaders['RateLimit-Limit'] === '10', lastHeaders['RateLimit-Limit']);
}

// ===========================================================================
// SECTION 13 — Token redaction helper (F9)
// ===========================================================================
{
  const full = KEY_5X;
  const masked = redactKeyToken(full);
  check('F9 redacts a well-formed token', masked === 'opm-live-5x…7f0a', masked);
  check('F9 redaction drops the 16 hex characters of the secret', !masked.includes('9f8a3c2e1b4d7f0a'));
  check('F9 keeps enough prefix for humans', masked.startsWith('opm-live-5x'), masked);
  check('F9 drops unrecognised values entirely', redactKeyToken('random-string-here') === undefined);
  check('F9 drops empty / null / non-string values',
    redactKeyToken('') === undefined && redactKeyToken(null) === undefined && redactKeyToken(123) === undefined);
  check('F9 drops non-Opuszyra key shapes', redactKeyToken('sk-ant-abcdef1234567890') === undefined);
}

// ===========================================================================
// SECTION 14 — Optional admin credential on /api/keys (F10)
// ===========================================================================
{
  delete process.env.ADMIN_API_KEY;
  const open = await get('/api/keys');
  check('F10 with ADMIN_API_KEY unset, /api/keys stays open', open.res.status === 200, `got ${open.res.status}`);
  check('F10 unauthenticated key listing still returns data', open.json?.success === true);

  process.env.ADMIN_API_KEY = 'admin-secret-token-xyz';

  const missing = await get('/api/keys');
  check('F10 with ADMIN_API_KEY set, missing credential -> 401', missing.res.status === 401, `got ${missing.res.status}`);
  check('F10 rejection does not reveal the configured token', !missing.text.includes('admin-secret-token-xyz'));
  check('F10 rejection body is generic JSON', missing.json?.error?.type === 'authentication_error', missing.text.slice(0, 120));

  const wrong = await get('/api/keys', { headers: { 'x-admin-key': 'wrong-token' } });
  check('F10 wrong admin credential -> 401', wrong.res.status === 401, `got ${wrong.res.status}`);

  const right = await get('/api/keys', { headers: { 'x-admin-key': 'admin-secret-token-xyz' } });
  check('F10 correct admin credential -> 200', right.res.status === 200, `got ${right.res.status}`);

  const validKey = await get('/api/keys', { headers: { 'x-api-key': KEY_20X } });
  check('F10 a valid active local key is accepted', validKey.res.status === 200, `got ${validKey.res.status}`);

  const viaBearer = await get('/api/keys', { headers: { authorization: `Bearer ${KEY_20X}` } });
  check('F10 a valid key in the Authorization header is accepted', viaBearer.res.status === 200, `got ${viaBearer.res.status}`);

  delete process.env.ADMIN_API_KEY;
}

// ===========================================================================
// SECTION 15 — Log redaction (F11)
// ===========================================================================
{
  captured = '';
  await get('/api/keys/check?key=***');
  await get('/api/key-status?key=***');
  await new Promise((r) => setTimeout(r, 250));
  check('F11 morgan output redacts ?key=', !captured.includes('8d7e6f5c4b3a2109'), captured.split('\n').slice(-4).join('\n'));
  check('F11 morgan still emits request lines', captured.includes('/api/key-status'), captured.slice(-160));
}

// ===========================================================================
// SECTION 16 — Security headers (F12)
// ===========================================================================
{
  const h = await get('/api/health');
  check('F12 X-Content-Type-Options: nosniff', h.res.headers.get('x-content-type-options') === 'nosniff', h.res.headers.get('x-content-type-options'));
  check('F12 X-Frame-Options: SAMEORIGIN', h.res.headers.get('x-frame-options') === 'SAMEORIGIN', h.res.headers.get('x-frame-options'));
  check('F12 Referrer-Policy set', !!h.res.headers.get('referrer-policy'), h.res.headers.get('referrer-policy'));
}

// ===========================================================================
// SECTION 17 — Tier and order validation (F13, F14)
// ===========================================================================
{
  const H = { 'content-type': 'application/json' };
  for (const tier of ['5x', '20x', '5x_trial', 'custom']) {
    const r = await get('/api/stats/orders/create', { method: 'POST', headers: H, body: JSON.stringify({ tier }) });
    check(`F13 accepts legitimate tier "${tier}"`, r.res.status === 200 && r.json?.order, `got ${r.res.status}`);
  }
  const unknown = await get('/api/stats/orders/create', { method: 'POST', headers: H, body: JSON.stringify({ tier: 'UNLIMITED' }) });
  check('F13 unknown tier falls back to the 5x allowance', unknown.json?.order?.tier === '5x', JSON.stringify(unknown.json?.order));
  check('F13 unknown tier does not mint a larger allowance', unknown.json?.order?.tier !== '20x');

  const huge = await get('/api/stats/orders/create', { method: 'POST', headers: H, body: JSON.stringify({ tier: 'x'.repeat(20000) }) });
  check('F13 oversized tier string is normalised', typeof huge.json?.order?.tier === 'string' && huge.json.order.tier.length < 32, String(huge.json?.order?.tier)?.slice(0, 40));

  const noFields = await get('/api/stats/orders/verify', { method: 'POST', headers: H, body: JSON.stringify({}) });
  check('F14 verify with no fields -> 400', noFields.res.status === 400, `got ${noFields.res.status}`);
  check('F14 empty verify mints no key', !/opm-live/.test(noFields.text));

  const missingHash = await get('/api/stats/orders/verify', {
    method: 'POST', headers: H, body: JSON.stringify({ orderId: 'ord_test123', tier: '5x' })
  });
  check('F14 verify with a missing txHash -> 400', missingHash.res.status === 400, `got ${missingHash.res.status}`);
  check('F14 missing txHash mints no key', !/opm-live/.test(missingHash.text));
}

// ===========================================================================
// Report
// ===========================================================================
process.stdout.write = origWrite;
console.log('\n' + '='.repeat(78));
console.log(`OpusZyra Phase 2 — ${passed} passed, ${failed} failed, ${results.length} total`);
console.log('='.repeat(78));
for (const r of results) {
  console.log(`${r.ok ? '  ✓' : '  ✗'} ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
}
console.log('='.repeat(78));
if (failed > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  ✗ ${f.name} -> ${f.detail}`);
}
console.log(`\nupstream fetches mocked (never sent to a real host): ${fetchLog.length}`);
await srv.close();
process.exit(failed > 0 ? 1 : 0);
