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

const KEY = 'opm-live-5x-9f8a3c2e1b4d7f0a';

console.log('--- direct mock lookup for 5x key ---');
const { data } = await supabase.from('api_keys').select('*').eq('key_token', KEY).maybeSingle();
console.log('found:', Boolean(data), data?.name, '| used:', data?.window_tokens_used, '| limit:', data?.window_token_limit);

console.log('--- over HTTP ---');
const r = await realFetch(`${BASE}/api/key-status?key=${KEY}`);
console.log('status:', r.status);
const body = await r.text();
console.log('body:', body.slice(0, 160));
const parsed = JSON.parse(body);
console.log('key.window_tokens_used:', parsed.key?.window_tokens_used);
console.log('key.window_token_limit:', parsed.key?.window_token_limit);

await srv.close();
