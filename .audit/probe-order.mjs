process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
delete process.env.SUPABASE_URL;
delete process.env.ADMIN_API_KEY;

const realFetch = globalThis.fetch.bind(globalThis);
let fail = false;
globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };

const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');
const crypto = await import('node:crypto');
const http = await import('node:http');

const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const BASE = `http://127.0.0.1:${srv.address().port}`;
const g = (p, o) => realFetch(`${BASE}${p}`, o);

// Mirror section 3: insert a fresh key and proxy a valid request.
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

console.log('--- after insert: count in mock ---');
const { data: all } = await supabase.from('api_keys').select('*');
console.log('rows:', all.length);

// updateTokensAndLog runs on a successful proxy.
globalThis.fetch = async () => ({
  ok: true, status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({ usage: { input_tokens: 12, output_tokens: 34 } }),
  text: async () => '{}', body: null
});
await g('/v1/messages', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-api-key': token },
  body: JSON.stringify({ model: 'claude-3-7-sonnet-20250219', messages: [{ role: 'user', content: 'ping' }] })
});

console.log('--- after proxy: rows in mock ---');
const { data: all2 } = await supabase.from('api_keys').select('*');
console.log('rows:', all2.length);

console.log('--- direct lookup of 20x key ---');
const r = await supabase.from('api_keys').select('*').eq('key_token', 'opm-live-20x-8d7e6f5c4b3a2109').maybeSingle();
console.log('found:', Boolean(r.data), '| error:', JSON.stringify(r.error));

console.log('--- over HTTP ---');
globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
const hr = await g('/api/key-status?key=***');
console.log('status:', hr.status);
console.log('body:', (await hr.text()).slice(0, 200));

await srv.close();
