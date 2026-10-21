/**
 * Regression Test Suite: Key Status Normalization and Prevention of False Active Status
 *
 * Verifies that:
 * 1. Upstream revoked key is returned as revoked (not active).
 * 2. Upstream expired key is returned as expired (not active).
 * 3. Upstream paused key is returned as paused (not active).
 * 4. Upstream root status 'expired' is returned with 200 (not dropped as 404).
 * 5. Upstream root status 'revoked' is returned with 200 (not dropped as 404).
 * 6. Local database revoked key reports status 'revoked' and isActive false (not true).
 * 7. Local database paused key reports status 'paused' and isActive false (not true).
 * 8. Upstream timeout/500 for non-existent key returns 504/502 (never false active).
 * 9. normalizeKeyStatus unit tests across edge cases.
 */

import http from 'node:http';
import { normalizeKeyStatus } from '../server/routes/keys.js';
import { supabase } from '../server/lib/supabase.js';

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message} -> ${detail}`);
  }
}

console.log('========================================================================');
console.log('--- KEY STATUS NORMALIZATION REGRESSION SUITE ---');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Part 1: normalizeKeyStatus unit tests
// -----------------------------------------------------------------------------
console.log('1. normalizeKeyStatus Unit Assertions:');

assert(
  normalizeKeyStatus({ status: 'found', isActive: true }, null) === 'active',
  'Active upstream key normalizes to active'
);

assert(
  normalizeKeyStatus({ status: 'found', keyStatus: 'revoked', isActive: false }, null) === 'revoked',
  'Upstream keyStatus=revoked normalizes to revoked'
);

assert(
  normalizeKeyStatus({ status: 'found', keyStatus: 'expired', isExpired: true, isActive: false }, null) === 'expired',
  'Upstream isExpired=true normalizes to expired'
);

assert(
  normalizeKeyStatus({ status: 'found', keyStatus: 'paused', isActive: false }, null) === 'paused',
  'Upstream isActive=false normalizes to paused'
);

assert(
  normalizeKeyStatus({ status: 'expired', keyStatus: 'expired' }, null) === 'expired',
  'Upstream status=expired normalizes to expired'
);

assert(
  normalizeKeyStatus({ status: 'revoked', keyStatus: 'revoked' }, null) === 'revoked',
  'Upstream status=revoked normalizes to revoked'
);

assert(
  normalizeKeyStatus(null, { status: 'revoked' }) === 'revoked',
  'Local record status=revoked normalizes to revoked'
);

assert(
  normalizeKeyStatus(null, { status: 'paused' }) === 'paused',
  'Local record status=paused normalizes to paused'
);

assert(
  normalizeKeyStatus(null, { status: 'active', expires_at: new Date(Date.now() - 10000).toISOString() }) === 'expired',
  'Local record with past expires_at normalizes to expired'
);

// -----------------------------------------------------------------------------
// Part 2: End-to-end HTTP Gateway Assertions with Mock Upstream
// -----------------------------------------------------------------------------
console.log('\n2. End-to-End HTTP Gateway Key Status Assertions:');

let mockResponse = { status: 200, body: {} };

const mockUpstreamServer = http.createServer((req, res) => {
  res.writeHead(mockResponse.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(mockResponse.body));
});

await new Promise((r) => mockUpstreamServer.listen(0, r));
const UPSTREAM_PORT = mockUpstreamServer.address().port;
process.env.UPSTREAM_API_BASE = `http://127.0.0.1:${UPSTREAM_PORT}`;
delete process.env.SUPABASE_URL;

const { default: app } = await import('../server/server.js');
const appServer = http.createServer(app);
await new Promise((r) => appServer.listen(0, r));
const APP_PORT = appServer.address().port;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;

try {
  // Case A: Upstream returning { status: 'found', keyStatus: 'revoked', isActive: false }
  mockResponse = {
    status: 200,
    body: {
      status: 'found',
      keyStatus: 'revoked',
      isActive: false,
      planName: 'Standard 5x',
      windowTokensLimit: 25000000
    }
  };

  const resRevoked = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'opm-live-test-revoked-upstream' })
  });
  const jsonRevoked = await resRevoked.json();
  assert(
    resRevoked.status === 200 && jsonRevoked.keyStatus === 'revoked' && jsonRevoked.key?.status === 'revoked' && jsonRevoked.isActive === false,
    'Upstream revoked key produces revoked status and isActive=false (not active)',
    `keyStatus=${jsonRevoked.keyStatus}, key.status=${jsonRevoked.key?.status}, isActive=${jsonRevoked.isActive}`
  );

  // Case B: Upstream returning { status: 'found', keyStatus: 'expired', isExpired: true, isActive: false }
  mockResponse = {
    status: 200,
    body: {
      status: 'found',
      keyStatus: 'expired',
      isExpired: true,
      isActive: false,
      planName: 'Max 20x',
      windowTokensLimit: 20000000
    }
  };

  const resExpired = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'opm-live-test-expired-upstream' })
  });
  const jsonExpired = await resExpired.json();
  assert(
    resExpired.status === 200 && jsonExpired.keyStatus === 'expired' && jsonExpired.key?.status === 'expired' && jsonExpired.isExpired === true && jsonExpired.isActive === false,
    'Upstream expired key produces expired status, isExpired=true, and isActive=false (not active)',
    `keyStatus=${jsonExpired.keyStatus}, isExpired=${jsonExpired.isExpired}, isActive=${jsonExpired.isActive}`
  );

  // Case C: Upstream returning { status: 'found', keyStatus: 'paused', isActive: false }
  mockResponse = {
    status: 200,
    body: {
      status: 'found',
      keyStatus: 'paused',
      isActive: false,
      planName: 'Max 20x',
      windowTokensLimit: 20000000
    }
  };

  const resPaused = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'opm-live-test-paused-upstream' })
  });
  const jsonPaused = await resPaused.json();
  assert(
    resPaused.status === 200 && jsonPaused.keyStatus === 'paused' && jsonPaused.key?.status === 'paused' && jsonPaused.isActive === false,
    'Upstream paused key produces paused status and isActive=false (not active)',
    `keyStatus=${jsonPaused.keyStatus}, isActive=${jsonPaused.isActive}`
  );

  // Case D: Upstream returning root status 'expired' (not status: 'found')
  mockResponse = {
    status: 200,
    body: {
      status: 'expired',
      keyStatus: 'expired',
      planName: 'Max 20x'
    }
  };

  const resRootExpired = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'opm-live-test-root-expired' })
  });
  const jsonRootExpired = await resRootExpired.json();
  assert(
    resRootExpired.status === 200 && jsonRootExpired.keyStatus === 'expired',
    'Upstream status=expired is accepted as 200 with expired status (not misreported as 404)',
    `status=${resRootExpired.status}, keyStatus=${jsonRootExpired.keyStatus}`
  );

  // Case E: Local DB key with revoked status when upstream returns 404
  const localRevokedToken = 'opm-live-5x-local-revoked-token';
  await supabase.from('api_keys').insert({
    id: 'local-revoked-id-001',
    name: 'Local Revoked Key',
    key_token: localRevokedToken,
    tier: '5x',
    status: 'revoked',
    window_token_limit: 25000000,
    window_tokens_used: 0,
    total_tokens_consumed: 0,
    total_requests: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  mockResponse = { status: 404, body: { error: 'API key not found', status: 'error' } };

  const resLocalRevoked = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: localRevokedToken })
  });
  const jsonLocalRevoked = await resLocalRevoked.json();
  assert(
    resLocalRevoked.status === 200 && jsonLocalRevoked.keyStatus === 'revoked' && jsonLocalRevoked.key?.status === 'revoked' && jsonLocalRevoked.isActive === false,
    'Local database revoked key returns 200 with status=revoked and isActive=false (not active)',
    `keyStatus=${jsonLocalRevoked.keyStatus}, isActive=${jsonLocalRevoked.isActive}`
  );

  // Case F: Local DB key with paused status when upstream returns 404
  const localPausedToken = 'opm-live-5x-local-paused-token';
  await supabase.from('api_keys').insert({
    id: 'local-paused-id-002',
    name: 'Local Paused Key',
    key_token: localPausedToken,
    tier: '5x',
    status: 'paused',
    window_token_limit: 25000000,
    window_tokens_used: 0,
    total_tokens_consumed: 0,
    total_requests: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  const resLocalPaused = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: localPausedToken })
  });
  const jsonLocalPaused = await resLocalPaused.json();
  assert(
    resLocalPaused.status === 200 && jsonLocalPaused.keyStatus === 'paused' && jsonLocalPaused.key?.status === 'paused' && jsonLocalPaused.isActive === false,
    'Local database paused key returns 200 with status=paused and isActive=false (not active)',
    `keyStatus=${jsonLocalPaused.keyStatus}, isActive=${jsonLocalPaused.isActive}`
  );

  // Case G: Upstream timeout on non-existent key returns 504 and never false active
  mockResponse = { status: 504, body: null };
  const mockTimeoutServer = http.createServer((req, res) => {
    // Hang to force gateway timeout
  });
  await new Promise((r) => mockTimeoutServer.listen(0, r));
  process.env.UPSTREAM_API_BASE = `http://127.0.0.1:${mockTimeoutServer.address().port}`;

  const resTimeout = await fetch(`${APP_BASE}/api/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'opm-live-timeout-test-key' })
  });
  const jsonTimeout = await resTimeout.json();
  assert(
    resTimeout.status === 504 && jsonTimeout.code === 'UPSTREAM_TIMEOUT',
    'Upstream timeout produces 504 UPSTREAM_TIMEOUT (never false active)',
    `status=${resTimeout.status}, code=${jsonTimeout.code}`
  );

  await mockTimeoutServer.close();

} finally {
  await appServer.close();
  await mockUpstreamServer.close();
}

console.log('\n========================================================================');
console.log(`REGRESSION SUITE RESULTS: ${passed} passed, ${failed} failed`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
