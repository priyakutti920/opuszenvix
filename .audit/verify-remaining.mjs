/**
 * Confirms the two checks that the main harness could not pass due to a bug in
 * the harness itself (a literal placeholder was sent instead of a real token,
 * and the per-IP rate limiter exhausted the window before the quota test).
 *
 * Each scenario uses its own freshly booted app instance.
 */
process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.UPSTREAM_API_KEY;
delete process.env.ADMIN_API_KEY;

const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async () => { throw new DOMException('The operation timed out.', 'TimeoutError'); };

const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');
const http = await import('node:http');
const crypto = await import('node:crypto');

const KEY_20X = 'opm-live-20x-8d7e6f5c4b3a2109';
let okCount = 0, failCount = 0;
const check = (name, cond, detail = '') => {
  if (cond) okCount++; else failCount++;
  console.log(`  ${cond ? '✓' : '✗'} ${name}${cond ? '' : `  -> ${detail}`}`);
};

// -------------------------------------------------------------------------
// Scenario A: /api/key-status answers from local data when upstream is down
// -------------------------------------------------------------------------
{
  const srv = http.createServer(app);
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}`;

  const res = await realFetch(`${base}/api/key-status?key=***`);
  const body = await res.text();
  const json = JSON.parse(body);

  check('A1 key-status resolves when upstream is down', res.status === 200, `got ${res.status}`);
  check('A2 seeded key served from local data', json.key?.key_token === KEY_20X, body.slice(0, 120));
  check('A3 local record is authoritative', Boolean(json.key?.id) && json.key.id !== 'upstream-key', json.key?.id);
  await srv.close();
}

// -------------------------------------------------------------------------
// Scenario B: the 5-hour quota window still returns its own 429
// Uses a fresh limiter bucket by pointing the caller at a distinct IP.
// -------------------------------------------------------------------------
{
  const srv = http.createServer(app);
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}`;

  // Exhaust the seeded 5x key's rolling window.
  const KEY_5X = 'opm-live-5x-9f8a3c2e1b4d7f0a';
  const { data } = await supabase.from('api_keys').select('*').eq('key_token', KEY_5X).maybeSingle();
  await supabase.from('api_keys').update({ window_tokens_used: data.window_token_limit }).eq('id', data.id);

  const res = await realFetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY_5X,
      'x-forwarded-for': '198.51.100.77'   // separate bucket from the test harness IP
    },
    body: JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'hi' }] })
  });
  const json = JSON.parse(await res.text());

  check('B1 exhausted 5h window yields 429', res.status === 429, `got ${res.status}`);
  check('B2 quota message preserved (not the rate limiter)',
    /5-hour window capacity exceeded/i.test(json.error?.message || ''), json.error?.message);
  check('B3 error type is rate_limit_error', json.error?.type === 'rate_limit_error', json.error?.type);
  await srv.close();
}

console.log(`\n${okCount} passed, ${failCount} failed`);
process.exit(failCount > 0 ? 1 : 0);
