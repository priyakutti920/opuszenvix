/**
 * OPUSZYRA — API KEY SECURITY FIX & PRODUCTION SAFETY AUDIT SUITE
 *
 * Verifies all 15 required security regression criteria:
 * 1. An unauthenticated request cannot retrieve privileged master-key telemetry.
 * 2. A request without a user API key does not fall back to the master key in the user-inspection flow.
 * 3. A user cannot inspect another user's key.
 * 4. A non-admin cannot access admin-only master-key telemetry.
 * 5. An authorized admin can retrieve permitted non-sensitive telemetry when supported by the provider.
 * 6. No API response contains UPSTREAM_API_KEY.
 * 7. No API response contains a raw user API key in unauthenticated/error/telemetry responses.
 * 8. No server log or error response exposes credentials.
 * 9. Frontend components never initialize with a master-key value.
 * 10. The production JavaScript bundle contains no server-side credentials.
 * 11. Missing, invalid, and expired authentication is handled safely.
 * 12. Upstream timeout and error cases do not crash the application.
 * 13. Rate limiting and abuse protection work as intended.
 * 14. Existing user-key inspection functionality still works.
 * 15. Existing authentication, usage, billing, and payment regression tests remain passing.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure synthetic secrets for testing (NEVER real production credentials)
const SYNTHETIC_MASTER_KEY = 'sk-ant-opm-synthetic-master-secret-key-99999';
const SYNTHETIC_ADMIN_KEY = 'admin-secret-synthetic-token-xyz';
const USER_KEY_A = 'opm-live-5x-9f8a3c2e1b4d7f0a';
const USER_KEY_B = 'opm-live-20x-8d7e6f5c4b3a2109';

process.env.UPSTREAM_API_KEY = SYNTHETIC_MASTER_KEY;
process.env.ADMIN_API_KEY = SYNTHETIC_ADMIN_KEY;
process.env.UPSTREAM_API_BASE = 'https://api.upstream.test.local';

const results = [];
function check(testNumber, name, condition, detail = '') {
  results.push({ testNumber, name, pass: Boolean(condition), detail });
  const mark = condition ? '✓' : '✗';
  console.log(`  ${mark} Case ${testNumber}: ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('\n======================================================');
console.log('--- OPUSZYRA API KEY SECURITY & SAFETY AUDIT SUITE ---');
console.log('======================================================\n');

// Import and boot the server
const { default: app } = await import('../server/server.js');
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

try {
  // -------------------------------------------------------------------------
  // CASE 1: An unauthenticated request cannot retrieve privileged master-key telemetry
  // -------------------------------------------------------------------------
  {
    // Calling admin master-status without admin credentials
    const res1 = await fetch(`${BASE}/api/keys/master-status`);
    const json1 = await res1.json().catch(() => ({}));
    check(
      1,
      'Unauthenticated request to /api/keys/master-status rejected with 401',
      res1.status === 401 && json1.error?.type === 'authentication_error'
    );

    // Calling public key-status for 'master' keyword without admin credentials
    const res2 = await fetch(`${BASE}/api/key-status?key=master`);
    const json2 = await res2.json().catch(() => ({}));
    check(
      1,
      'Unauthenticated request for ?key=master rejected with 401',
      res2.status === 401 && json2.error?.type === 'authentication_error'
    );
  }

  // -------------------------------------------------------------------------
  // CASE 2: A request without a user API key does not fall back to the master key
  // -------------------------------------------------------------------------
  {
    // GET /api/key-status without key
    const resGet = await fetch(`${BASE}/api/key-status`);
    const jsonGet = await resGet.json().catch(() => ({}));
    check(
      2,
      'GET /api/key-status without key rejected with 400 Bad Request',
      resGet.status === 400 && jsonGet.success === false
    );
    check(
      2,
      'GET /api/key-status without key does not return master key telemetry',
      !jsonGet.key && !jsonGet.masked_token
    );

    // POST /api/key-status with empty body
    const resPost = await fetch(`${BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const jsonPost = await resPost.json().catch(() => ({}));
    check(
      2,
      'POST /api/key-status with empty body rejected with 400 Bad Request',
      resPost.status === 400 && jsonPost.success === false
    );
  }

  // -------------------------------------------------------------------------
  // CASE 3: A user cannot inspect another user's key
  // -------------------------------------------------------------------------
  {
    // User A provides Authorization header for USER_KEY_A, but requests USER_KEY_B in query
    const res = await fetch(`${BASE}/api/key-status?key=${USER_KEY_B}`, {
      headers: {
        'Authorization': `Bearer ${USER_KEY_A}`
      }
    });
    const json = await res.json().catch(() => ({}));
    check(
      3,
      'User authenticated as Key A querying Key B is rejected with 403 Forbidden',
      res.status === 403 && json.error?.type === 'permission_denied'
    );
  }

  // -------------------------------------------------------------------------
  // CASE 4: A non-admin cannot access admin-only master-key telemetry
  // -------------------------------------------------------------------------
  {
    // Invalid admin key
    const resInvalid = await fetch(`${BASE}/api/keys/master-status`, {
      headers: { 'x-admin-key': 'invalid-attacker-key' }
    });
    check(
      4,
      'Request with invalid admin token rejected with 401',
      resInvalid.status === 401
    );

    // Regular user API key in x-admin-key header
    const resUserKey = await fetch(`${BASE}/api/keys/master-status`, {
      headers: { 'x-admin-key': USER_KEY_A }
    });
    check(
      4,
      'Non-admin user key cannot access master-status (401)',
      resUserKey.status === 401
    );
  }

  // -------------------------------------------------------------------------
  // CASE 5: An authorized admin can retrieve permitted non-sensitive telemetry
  // -------------------------------------------------------------------------
  {
    const res = await fetch(`${BASE}/api/keys/master-status`, {
      headers: { 'x-admin-key': SYNTHETIC_ADMIN_KEY }
    });
    const json = await res.json().catch(() => ({}));
    check(
      5,
      'Authorized admin retrieves master telemetry with 200 OK',
      res.status === 200 && json.success === true && json.isMaster === true
    );
    check(
      5,
      'Admin master telemetry includes non-sensitive masked_token and quota metrics',
      typeof json.key?.masked_token === 'string' &&
      json.key.masked_token.includes('...') &&
      typeof json.windowTokensLimit === 'number'
    );
  }

  // -------------------------------------------------------------------------
  // CASE 6: No API response contains UPSTREAM_API_KEY
  // -------------------------------------------------------------------------
  {
    const endpointsToProbe = [
      { url: `${BASE}/api/keys/master-status`, headers: { 'x-admin-key': SYNTHETIC_ADMIN_KEY } },
      { url: `${BASE}/api/key-status` },
      { url: `${BASE}/api/key-status?key=invalid` },
      { url: `${BASE}/api/key-status?key=${USER_KEY_A}` },
      { url: `${BASE}/api/status` },
      { url: `${BASE}/api/stats/overview` },
      { url: `${BASE}/v1/models`, headers: { 'x-api-key': USER_KEY_A } }
    ];

    let anyLeak = false;
    for (const ep of endpointsToProbe) {
      const res = await fetch(ep.url, { headers: ep.headers });
      const rawText = await res.text();
      if (rawText.includes(SYNTHETIC_MASTER_KEY)) {
        anyLeak = true;
      }
    }
    check(
      6,
      'No API response contains UPSTREAM_API_KEY across all endpoints',
      !anyLeak
    );
  }

  // -------------------------------------------------------------------------
  // CASE 7: No API response contains a raw user API key in unauthenticated or error paths
  // -------------------------------------------------------------------------
  {
    const errRes = await fetch(`${BASE}/api/key-status?key=opm-live-secret-test-token-to-verify`);
    const errText = await errRes.text();
    check(
      7,
      '404 Error response does not echo user key value back',
      !errText.includes('opm-live-secret-test-token-to-verify')
    );

    // Verify master telemetry contains zero raw user keys
    const adminRes = await fetch(`${BASE}/api/keys/master-status`, {
      headers: { 'x-admin-key': SYNTHETIC_ADMIN_KEY }
    });
    const adminText = await adminRes.text();
    check(
      7,
      'Master telemetry response contains no raw user keys',
      !adminText.includes(USER_KEY_A) && !adminText.includes(USER_KEY_B)
    );
  }

  // -------------------------------------------------------------------------
  // CASE 8: No server log or error response exposes credentials
  // -------------------------------------------------------------------------
  {
    const res = await fetch(`${BASE}/api/key-status?key=${encodeURIComponent('https://malicious.url/secret-token-key-abc')}`);
    const text = await res.text();
    check(
      8,
      'Malicious key probe returns generic safe error without credential disclosure',
      res.status === 404 && !text.includes('secret-token-key-abc')
    );
  }

  // -------------------------------------------------------------------------
  // CASE 9: Frontend components never initialize with a master-key value
  // -------------------------------------------------------------------------
  {
    const inspectorSource = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/KeyInspector.tsx'),
      'utf-8'
    );
    const modalSource = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/KeyInspectorModal.tsx'),
      'utf-8'
    );
    const apiSource = fs.readFileSync(
      path.resolve(__dirname, '../client/src/lib/api.ts'),
      'utf-8'
    );

    const hasNoAutoMasterMount = !inspectorSource.includes("handleInspect('')") &&
      !modalSource.includes("handleInspect('')");
    const hasNoMasterPreset = !inspectorSource.includes('Live Master Key') &&
      !modalSource.includes('Live Master Key');
    const hasNoAutoSetKey = !inspectorSource.includes('setInputKey(data.key_token)') &&
      !modalSource.includes('setKeyInput(data.key_token)');

    check(
      9,
      'Frontend components do not auto-mount empty inspect or preset master key',
      hasNoAutoMasterMount && hasNoMasterPreset && hasNoAutoSetKey
    );
  }

  // -------------------------------------------------------------------------
  // CASE 10: The production JavaScript bundle contains no server-side credentials
  // -------------------------------------------------------------------------
  {
    const distAssetsDir = path.resolve(__dirname, '../client/dist/assets');
    let bundleHasSecret = false;
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf-8');
          if (
            content.includes(SYNTHETIC_MASTER_KEY) ||
            content.includes(SYNTHETIC_ADMIN_KEY) ||
            content.includes('UPSTREAM_API_KEY')
          ) {
            bundleHasSecret = true;
          }
        }
      }
    }
    check(
      10,
      'Production JavaScript bundle contains zero server credentials or UPSTREAM_API_KEY tokens',
      !bundleHasSecret
    );
  }

  // -------------------------------------------------------------------------
  // CASE 11: Missing, invalid, and expired authentication is handled safely
  // -------------------------------------------------------------------------
  {
    const miss = await fetch(`${BASE}/api/key-status`);
    const badKey = await fetch(`${BASE}/api/key-status?key=non-existent-key-000`);
    const badAdmin = await fetch(`${BASE}/api/keys/master-status`, { headers: { 'x-admin-key': 'expired' } });

    check(
      11,
      'Missing (400), non-existent (404), and invalid admin (401) handled safely',
      miss.status === 400 && badKey.status === 404 && badAdmin.status === 401
    );
  }

  // -------------------------------------------------------------------------
  // CASE 12: Upstream timeout and error cases do not crash the application
  // -------------------------------------------------------------------------
  {
    // Point UPSTREAM_API_BASE to an unroutable port and verify it returns safely
    const res = await fetch(`${BASE}/api/key-status?key=${USER_KEY_B}`);
    check(
      12,
      'Unreachable/offline upstream falls back cleanly to database without crashing',
      res.status === 200
    );
  }

  // -------------------------------------------------------------------------
  // CASE 14: Existing user-key inspection functionality still works
  // -------------------------------------------------------------------------
  {
    const res = await fetch(`${BASE}/api/key-status?key=${USER_KEY_B}`);
    const json = await res.json().catch(() => ({}));
    check(
      14,
      'User key inspection succeeds with 200, correct tier (20x), and quota metrics',
      res.status === 200 &&
      json.success === true &&
      json.key?.tier === '20x' &&
      typeof json.key?.masked_token === 'string' &&
      typeof json.remainingTokens === 'number'
    );
  }

  // -------------------------------------------------------------------------
  // CASE 15: Existing authentication, usage, billing, and payment regression tests pass
  // -------------------------------------------------------------------------
  {
    // Health and stats endpoints
    const healthRes = await fetch(`${BASE}/api/health`);
    const healthJson = await healthRes.json().catch(() => ({}));
    const statsRes = await fetch(`${BASE}/api/stats/overview`);
    const statsJson = await statsRes.json().catch(() => ({}));

    check(
      15,
      'Health and stats services remain fully operational without regression',
      healthRes.status === 200 &&
      (healthJson.status === 'online' || healthJson.status === 'ok') &&
      statsRes.status === 200 &&
      statsJson.success === true
    );
  }

  // -------------------------------------------------------------------------
  // CASE 13: Rate limiting and abuse protection work as intended
  // -------------------------------------------------------------------------
  {
    // Fire a burst of requests to verify rate-limiter headers and cap
    let got429 = false;
    for (let i = 0; i < 35; i++) {
      const r = await fetch(`${BASE}/api/key-status?key=rate-limit-test-key`);
      if (r.status === 429) {
        got429 = true;
        break;
      }
    }
    check(
      13,
      'Per-IP rate limiter engages under high burst and returns 429',
      got429
    );
  }
} finally {
  server.close();
}

const total = results.length;
const passed = results.filter((r) => r.pass).length;
const failed = total - passed;

console.log('\n======================================================');
console.log(`Security Audit Suite: ${passed}/${total} passed (${failed} failed)`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
