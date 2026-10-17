process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
delete process.env.SUPABASE_URL;
delete process.env.ADMIN_API_KEY;

const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };

const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');
const http = await import('node:http');

const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

// Step 1: /api/status while upstream throws (mirrors section 9 first call)
console.log('rows before:', supabase.apiKeys.length);
const st = await realFetch(`${BASE}/api/status`);
console.log('/api/status ->', st.status, (await st.text()).slice(0, 60));

console.log('rows after /api/status:', supabase.apiKeys.length);

// Step 2: key-status for the seeded 20x key
const KEY = 'opm-live-20x-8d7e6f5c4b3a2109';
const direct = await supabase.from('api_keys').select('*').eq('key_token', KEY).maybeSingle();
console.log('direct lookup found:', Boolean(direct.data), '| error:', JSON.stringify(direct.error));

const r = await realFetch(`${BASE}/api/key-status?key=${KEY}`);
console.log('http status:', r.status);
console.log('http body:', (await r.text()).slice(0, 160));

await srv.close();
