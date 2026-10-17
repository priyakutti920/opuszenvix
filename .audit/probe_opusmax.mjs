/**
 * Safe Probe for new upstream provider: https://api.opusmax.live
 * Tests reachability, endpoints, models, auth, and protocol support
 * WITHOUT exposing credentials.
 */

import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const TARGET_BASE = 'https://api.opusmax.live';
const KEY = (process.env.UPSTREAM_API_KEY || '').trim();

console.log('Target Base:', TARGET_BASE);
console.log('Target Key present:', Boolean(KEY));

async function probeEndpoint(path, method = 'GET', headers = {}, body = null) {
  try {
    const t0 = performance.now();
    const opts = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers
      },
      signal: AbortSignal.timeout(10_000)
    };
    if (body) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${TARGET_BASE}${path}`, opts);
    const ms = (performance.now() - t0).toFixed(1);
    const contentType = res.headers.get('content-type') || '';
    let text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    return {
      status: res.status,
      ok: res.ok,
      ms,
      contentType,
      textLength: text.length,
      sample: json ? JSON.stringify(json).slice(0, 200) : text.slice(0, 200)
    };
  } catch (err) {
    return { error: err.name + ': ' + err.message };
  }
}

console.log('\n--- 1. REACHABILITY CHECKS ---');
console.log('GET /:', await probeEndpoint('/'));
console.log('GET /api/health:', await probeEndpoint('/api/health'));
console.log('GET /api/status:', await probeEndpoint('/api/status'));
console.log('GET /v1/messages:', await probeEndpoint('/v1/messages'));

console.log('\n--- 2. MODELS ENDPOINT ---');
console.log('GET /v1/models (no auth):', await probeEndpoint('/v1/models'));
if (KEY) {
  console.log('GET /v1/models (x-api-key):', await probeEndpoint('/v1/models', 'GET', { 'x-api-key': KEY }));
}

console.log('\n--- 3. AUTHENTICATION & KEY STATUS ---');
if (KEY) {
  console.log('GET /api/key-status (query):', await probeEndpoint(`/api/key-status?key=${encodeURIComponent(KEY)}`));
  console.log('POST /api/key-status (json):', await probeEndpoint('/api/key-status', 'POST', {}, { key: KEY }));
}
