/**
 * Probe for the "Supported Models on this Key" wiring.
 *
 *   1. /v1/models       — live upstream catalog the key-status handler mirrors
 *   2. /api/key-status  — the endpoint the /usage chips actually render from
 *
 * Uses the demo key already hardcoded in server/lib/supabase.js mock DB, so it
 * needs no credential. Prints model ids and status codes only.
 */

const BASE = 'http://localhost:5000';
const DEMO_KEY = 'opm-live-5x-9f8a3c2e1b4d7f0a';

const idsFromModels = (payload) =>
  Array.isArray(payload?.data)
    ? payload.data.map((m) => m?.id).filter((id) => typeof id === 'string' && id.trim())
    : [];

let failures = 0;
const check = (label, pass, detail = '') => {
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

console.log('--- 1. LIVE MODEL CATALOG (' + BASE + '/v1/models) ---');
const res = await fetch(`${BASE}/v1/models`, {
  signal: AbortSignal.timeout(12_000),
  headers: { Accept: 'application/json' }
});
check('gateway reachable', res.ok, `status ${res.status}`);
const catalogIds = [...new Set(idsFromModels(await res.json()))];
console.log('  catalog size:', catalogIds.length);

// Same rule the server applies: strip a trailing "[...]" context marker and
// keep the first-seen id per base model, so 24 raw entries collapse to 15.
const baseOf = (id) => id.replace(/\[[^\]]*\]\s*$/, '').trim();
const collapsedIds = [...new Set(catalogIds.map(baseOf))];
check('collapse rule is well-defined', collapsedIds.length < catalogIds.length,
  `${catalogIds.length} raw -> ${collapsedIds.length} unique models`);

// 24 raw entries, 9 of which are [1m] context aliases of a model already listed.
check('catalog has entries', catalogIds.length > 0, `${catalogIds.length} ids`);
check('catalog carries context aliases', catalogIds.some((id) => id.includes('[')),
  `${catalogIds.filter((i) => i.includes('[')).length} alias ids`);

console.log('\n--- 2. KEY-STATUS PATH (demo key) ---');
const ksRes = await fetch(`${BASE}/api/key-status`, {
  method: 'POST',
  signal: AbortSignal.timeout(15_000),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ key: DEMO_KEY })
});
check('key-status responds ok', ksRes.ok, `status ${ksRes.status}`);
const payload = await ksRes.json();
const reported = Array.isArray(payload?.key?.models_accessible)
  ? payload.key.models_accessible
  : (Array.isArray(payload?.allowedModels) ? payload.allowedModels : []);

console.log('  reported models (' + reported.length + '):');
reported.forEach((id) => console.log('    -', id));

// The whole point of this change: the list comes from the live catalog, not the
// old 4-entry hardcoded array.
check('no longer the old hardcoded array', reported.length !== 4 || !reported.includes('claude-haiku-4-5-20251001'),
  'old fallback was 4 ids ending in claude-haiku-4-5-20251001');
check('matches collapsed catalog count', reported.length === collapsedIds.length,
  `reported ${reported.length}, expected ${collapsedIds.length}`);
check('no [1m] alias duplicates in chips', !reported.some((id) => id.includes('[')),
  'aliases collapsed to base model');
check('every reported id exists in catalog',
  reported.every((id) => catalogIds.includes(id)),
  'traceable to /v1/models');
check('no duplicates', new Set(reported).size === reported.length);

console.log('\n--- 3. INVALID KEY STILL REJECTED ---');
const badRes = await fetch(`${BASE}/api/key-status`, {
  method: 'POST',
  signal: AbortSignal.timeout(15_000),
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'opm-live-5x-not-a-real-key' })
});
check('unknown key is a 404', badRes.status === 404, `status ${badRes.status}`);

console.log(failures === 0
  ? '\nALL CHECKS PASSED'
  : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
