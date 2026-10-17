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

const KEY = 'opm-live-20x-8d7e6f5c4b3a2109';

console.log('--- direct mock lookup ---');
const { data } = await supabase.from('api_keys').select('*').eq('key_token', KEY).maybeSingle();
console.log('found:', Boolean(data), data?.name);

console.log('--- over HTTP ---');
const r = await realFetch(`${BASE}/api/key-status?key=${KEY}`);
console.log('status:', r.status);
console.log('body:', (await r.text()).slice(0, 200));

await srv.close();
