process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
delete process.env.SUPABASE_URL;
delete process.env.ADMIN_API_KEY;

const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };

const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');
const crypto = await import('node:crypto');
const http = await import('node:http');

const KEY = 'opm-live-20x-8d7e6f5c4b3a2109';

const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const BASE = `http://127.0.0.1:${srv.address().port}`;
const g = (p, o) => realFetch(`${BASE}${p}`, o);

// Monkey-patch the mock so every api_keys lookup is visible.
const origFrom = supabase.from.bind(supabase);
supabase.from = function (table) {
  const chain = origFrom(table);
  if (table !== 'api_keys') return chain;
  const origSelect = chain.select;
  chain.select = function (...a) {
    const sub = origSelect.apply(this, a);
    const origEq = sub.eq;
    sub.eq = function (col, val) {
      console.log(`  [mock] eq(${col}, ${JSON.stringify(val)})`);
      if (col === 'key_token' && typeof val === 'string') {
        const rows = origFrom(table).select('*');
        // count strict matches
        const matches = supabase.apiKeys.filter((k) => k[key_token_col(col)] === val).length;
        console.log(`  [mock]   -> exact matches in store: ${matches} | rows.length=${supabase.apiKeys.length}`);
      }
      return origEq.apply(this, [col, val]);
    };
    return sub;
  };
  return chain;
};
const key_token_col = (c) => c;

// Step 1: insert a fresh key (as section 3 does)
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
console.log('after insert, apiKeys.length =', supabase.apiKeys.length);

// Step 2: proxy a valid request so updateTokensAndLog runs
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
await new Promise((r) => setTimeout(r, 50));

// Step 3: HTTP key-status for the seeded 20x key
globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
console.log('\n[direct] lookup:');
const r = await supabase.from('api_keys').select('*').eq('key_token', KEY).maybeSingle();
console.log('  found:', Boolean(r.data));
console.log('\n[http] lookup:');
const hr = await g(`/api/key-status?key=***`);
console.log('  status:', hr.status, '|', (await hr.text()).slice(0, 90));
console.log('  apiKeys.length now =', supabase.apiKeys.length);
console.log('  tokens in store:', supabase.apiKeys.map((k) => k.key_token.slice(0, 18)));

await srv.close();
