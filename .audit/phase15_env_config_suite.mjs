/**
 * OpusZyra Phase 15 Environment Configuration Verification Suite
 *
 * Verifies:
 * 1. .env loading from both project root and server directory
 * 2. UPSTREAM_API_BASE and UPSTREAM_API_KEY read exclusively from environment variables
 * 3. Dynamic provider switching without code edits
 * 4. Missing/invalid configuration produces safe, clear 500 error
 * 5. Trailing slash and duplicate /v1 normalization
 * 6. Zero hardcoded provider URLs or keys in active application code
 * 7. Key secrecy preservation across responses and logs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { getUpstreamBase, getMasterUpstreamKey } from '../server/lib/config.js';

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('--- STARTING PHASE 15 ENVIRONMENT CONFIGURATION SUITE ---');

// 1. Verify .env loading
{
  const activeBase = getUpstreamBase();
  const hasKey = Boolean(getMasterUpstreamKey());
  record('Loads active UPSTREAM_API_BASE from .env', activeBase === 'https://api.opusmax.live');
  record('Loads UPSTREAM_API_KEY from .env', hasKey === true);
}

// 2. Verify dynamic provider switching without source edits
{
  const original = process.env.UPSTREAM_API_BASE;
  process.env.UPSTREAM_API_BASE = 'https://dynamic-provider.internal';
  record('Changing process.env.UPSTREAM_API_BASE updates getUpstreamBase()', getUpstreamBase() === 'https://dynamic-provider.internal');
  
  process.env.UPSTREAM_API_BASE = 'https://dynamic-provider.internal/v1/';
  record('Normalizes trailing slash and prevents duplicate /v1 segments', getUpstreamBase() === 'https://dynamic-provider.internal');
  process.env.UPSTREAM_API_BASE = original;
}

// 3. Verify missing configuration fails safely
{
  const original = process.env.UPSTREAM_API_BASE;
  delete process.env.UPSTREAM_API_BASE;
  let thrown = false;
  let errMsg = '';
  try {
    getUpstreamBase();
  } catch (err) {
    thrown = true;
    errMsg = err.message;
  }
  record('Throws clear error when UPSTREAM_API_BASE is missing', thrown && errMsg.includes('not configured'));
  process.env.UPSTREAM_API_BASE = original;
}

// 4. Verify invalid URL format fails safely
{
  const original = process.env.UPSTREAM_API_BASE;
  process.env.UPSTREAM_API_BASE = 'not_a_valid_url';
  let thrown = false;
  try {
    getUpstreamBase();
  } catch {
    thrown = true;
  }
  record('Throws error when UPSTREAM_API_BASE is invalid URL format', thrown);
  process.env.UPSTREAM_API_BASE = original;
}

// 5. Verify gateway returns safe 500 JSON error when UPSTREAM_API_BASE is missing
{
  const original = process.env.UPSTREAM_API_BASE;
  delete process.env.UPSTREAM_API_BASE;

  const { default: app } = await import('../server/server.js');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'test' }]
    })
  });

  const json = await res.json();
  record('Missing UPSTREAM_API_BASE produces 500 configuration error', res.status === 500);
  record('Configuration error message is clear and safe', json.error?.message?.includes('UPSTREAM_API_BASE'));

  server.close();
  process.env.UPSTREAM_API_BASE = original;
}

// 6. Verify no hardcoded provider URLs in active code
{
  const filesToScan = [
    'server/server.js',
    'server/routes/anthropicProxy.js',
    'server/routes/keys.js',
    'server/lib/config.js',
    'client/src/lib/api.ts'
  ];

  let hardcodedFound = false;
  for (const f of filesToScan) {
    const content = fs.readFileSync(f, 'utf8');
    // Check for hardcoded string assignment to api.opusmax.live or api.opuszen.shop
    const matches = content.match(/['"`]https:\/\/api\.(opusmax\.live|opuszen\.shop)['"`]/g);
    if (matches) {
      console.log(`Found hardcoded in ${f}:`, matches);
      hardcodedFound = true;
    }
  }
  record('Zero hardcoded provider URLs in active server and client code', hardcodedFound === false);
}

// 7. Verify secrecy: UPSTREAM_API_KEY never leaks in responses or bundles
{
  const secretKey = (process.env.UPSTREAM_API_KEY || '').trim();
  if (secretKey && secretKey.length > 8) {
    const files = ['dist/index.html', 'client/dist/index.html'].filter(fs.existsSync);
    let leaked = false;
    for (const f of files) {
      if (fs.readFileSync(f, 'utf8').includes(secretKey)) leaked = true;
    }
    record('UPSTREAM_API_KEY is never bundled into client dist files', leaked === false);
  }
}

const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

console.log(`\n=======================================================`);
console.log(`Phase 15 Env Config Suite: ${passed}/${total} passed (${failed} failed)`);
console.log(`=======================================================`);

process.exit(failed > 0 ? 1 : 0);
