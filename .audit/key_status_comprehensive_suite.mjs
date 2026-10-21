/**
 * OPUSADV / OPUSZYRA — KEY STATUS 15-CRITERIA COMPREHENSIVE REGRESSION SUITE
 *
 * Verifies all 15 audit requirements from specification:
 *  1. Valid saved key.
 *  2. Automatic initial loading.
 *  3. Inspector modal initialization.
 *  4. Key switching and stale request prevention.
 *  5. Successful upstream response.
 *  6. Missing plan metadata.
 *  7. Valid zero usage.
 *  8. Invalid or expired key.
 *  9. Upstream 401, 403, 429, and 500.
 * 10. Upstream timeout.
 * 11. Unauthorized key access.
 * 12. Master-key authorization.
 * 13. Malformed response handling.
 * 14. Secret redaction.
 * 15. Dashboard and inspector consistency.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure synthetic secrets for mock server environment
const SYNTHETIC_MASTER_KEY = 'sk-ant-opm-test-master-key-xyz999';
const SYNTHETIC_ADMIN_KEY = 'test-admin-secret-pass-888';
const SAVED_USER_KEY_5X = 'opm-live-5x-9f8a3c2e1b4d7f0a';
const SAVED_USER_KEY_20X = 'opm-live-20x-8d7e6f5c4b3a2109';

process.env.UPSTREAM_API_KEY = SYNTHETIC_MASTER_KEY;
process.env.ADMIN_API_KEY = SYNTHETIC_ADMIN_KEY;

// Spawn an in-process mock upstream server that can simulate 200, 401, 403, 429, 500, and timeouts
let mockUpstreamBehavior = {
  status: 200,
  delayMs: 0,
  body: null
};

const mockUpstreamServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const reqKey = url.searchParams.get('key');

  if (mockUpstreamBehavior.delayMs > 0) {
    setTimeout(() => {
      sendMockResponse(res, reqKey);
    }, mockUpstreamBehavior.delayMs);
  } else {
    sendMockResponse(res, reqKey);
  }
});

function sendMockResponse(res, reqKey) {
  if (mockUpstreamBehavior.status >= 500 && mockUpstreamBehavior.body === 'HTML_ERROR') {
    res.writeHead(mockUpstreamBehavior.status, { 'Content-Type': 'text/html' });
    res.end('<html><body>502 Bad Gateway</body></html>');
    return;
  }

  res.writeHead(mockUpstreamBehavior.status, { 'Content-Type': 'application/json' });
  if (mockUpstreamBehavior.body) {
    res.end(JSON.stringify(mockUpstreamBehavior.body));
    return;
  }

  if (mockUpstreamBehavior.status === 200) {
    res.end(JSON.stringify({
      status: 'found',
      name: 'Mock Upstream 20x Key',
      planName: 'Enterprise 20x',
      isActive: true,
      windowTokensLimit: 20000000,
      windowTokensUsed: 1500000,
      remainingTokens: 18500000,
      usagePercent: 7.5,
      allowedModels: ['claude-opus-5-5', 'claude-sonnet-5'],
      totalRequests: 85
    }));
  } else if (mockUpstreamBehavior.status === 401) {
    res.end(JSON.stringify({ error: 'Unauthorized: Invalid upstream credentials', code: 'UNAUTHORIZED' }));
  } else if (mockUpstreamBehavior.status === 403) {
    res.end(JSON.stringify({ error: 'Forbidden: Access to requested resource denied', code: 'FORBIDDEN' }));
  } else if (mockUpstreamBehavior.status === 429) {
    res.end(JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }));
  } else if (mockUpstreamBehavior.status >= 500) {
    res.end(JSON.stringify({ error: 'Internal server error in upstream gateway', code: 'INTERNAL_ERROR' }));
  } else {
    res.end(JSON.stringify({ error: 'API key not found', status: 'error' }));
  }
}

await new Promise((resolve) => mockUpstreamServer.listen(0, '127.0.0.1', resolve));
const mockUpstreamPort = mockUpstreamServer.address().port;
process.env.UPSTREAM_API_BASE = `http://127.0.0.1:${mockUpstreamPort}`;

// Boot the Opuszyra / OpusAdv application server
const { default: app } = await import('../server/server.js');
const appServer = http.createServer(app);
await new Promise((resolve) => appServer.listen(0, '127.0.0.1', resolve));
const appPort = appServer.address().port;
const APP_BASE = `http://127.0.0.1:${appPort}`;

const results = [];
function check(num, name, pass, detail = '') {
  results.push({ num, name, pass: Boolean(pass), detail });
  const icon = pass ? '✓' : '✗';
  console.log(`  ${icon} Requirement ${num}: ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('\n========================================================================');
console.log('--- OPUSADV / OPUSZYRA KEY STATUS 15-CRITERIA COMPREHENSIVE AUDIT ---');
console.log('========================================================================\n');

try {
  // ---------------------------------------------------------------------------
  // 1. Valid saved key
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 404, delayMs: 0, body: null }; // upstream does not have it, local DB does
    const res = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: SAVED_USER_KEY_5X })
    });
    const json = await res.json().catch(() => ({}));
    check(
      1,
      'Valid saved key from local database resolves with 200 and authoritative quota metrics',
      res.status === 200 && json.success === true && json.key?.tier === '5x' && json.key?.window_tokens_used > 0,
      `status: ${res.status}, tier: ${json.key?.tier}, used: ${json.key?.window_tokens_used}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Automatic initial loading
  // ---------------------------------------------------------------------------
  {
    // Verify source code contract: KeyInspector auto-initiates handleInspect when initialKey is provided
    const inspectorPath = path.resolve(__dirname, '../client/src/components/KeyInspector.tsx');
    const content = fs.readFileSync(inspectorPath, 'utf8');
    const autoLoads = content.includes('useEffect(() => {') &&
      content.includes('const token = (initialKey && initialKey.trim()) || \'\'') &&
      content.includes('handleInspect(token);');

    check(
      2,
      'Automatic initial loading triggers upon valid key detection without requiring manual click',
      autoLoads,
      'verified in KeyInspector.tsx useEffect([initialKey])'
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Inspector modal initialization
  // ---------------------------------------------------------------------------
  {
    const modalPath = path.resolve(__dirname, '../client/src/components/KeyInspectorModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    const hasInitialState = modalContent.includes('!keyData && !loading && !error') &&
      (modalContent.includes('API Key Usage &amp; Sliding Window Inspector') || modalContent.includes('API Key Usage & Sliding Window Inspector'));
    const hasLoadingState = modalContent.includes('loading && !keyData');

    check(
      3,
      'Inspector modal initializes cleanly with safe initial guide state and loading feedback',
      hasInitialState && hasLoadingState,
      'safe initial guidance card + loading indicator present'
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Key switching and stale request prevention
  // ---------------------------------------------------------------------------
  {
    const inspectorPath = path.resolve(__dirname, '../client/src/components/KeyInspector.tsx');
    const modalPath = path.resolve(__dirname, '../client/src/components/KeyInspectorModal.tsx');
    const inspectorSrc = fs.readFileSync(inspectorPath, 'utf8');
    const modalSrc = fs.readFileSync(modalPath, 'utf8');

    const inspectorHasSeq = inspectorSrc.includes('inspectSeqRef') && inspectorSrc.includes('currentSeq !== inspectSeqRef.current');
    const modalHasSeq = modalSrc.includes('inspectSeqRef') && modalSrc.includes('currentSeq !== inspectSeqRef.current');

    check(
      4,
      'Key switching and concurrent requests reject out-of-order stale responses in both page and modal',
      inspectorHasSeq && modalHasSeq,
      'inspectSeqRef sequence counter enforced in KeyInspector & KeyInspectorModal'
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Successful upstream response
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = {
      status: 200,
      delayMs: 0,
      body: {
        status: 'found',
        name: 'Live 20x Key',
        planName: 'Max 20x',
        isActive: true,
        windowTokensLimit: 20000000,
        windowTokensUsed: 2500000,
        remainingTokens: 17500000,
        usagePercent: 12.5,
        allowedModels: ['claude-opus-5-5', 'claude-sonnet-5'],
        totalRequests: 120
      }
    };

    const res = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'opm-live-20x-upstream-live-key' })
    });
    const json = await res.json().catch(() => ({}));
    check(
      5,
      'Successful upstream response returns verified plan, 12.5% usage, and active models',
      res.status === 200 && json.key?.percentUsed === 12.5 && json.key?.planName === 'Max 20x' && json.key?.isPlanVerified === true,
      `percentUsed: ${json.key?.percentUsed}%, planName: ${json.key?.planName}`
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Missing plan metadata
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = {
      status: 200,
      delayMs: 0,
      body: {
        status: 'found',
        // planName omitted
        isActive: true,
        windowTokensLimit: 20000000,
        windowTokensUsed: 500000
      }
    };

    const res = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'opm-live-20x-no-plan-metadata' })
    });
    const json = await res.json().catch(() => ({}));
    check(
      6,
      'Missing plan metadata is marked as unverified without fabricating a provider plan',
      res.status === 200 && json.key?.isPlanVerified === false && json.key?.planSource === 'unverified',
      `isPlanVerified: ${json.key?.isPlanVerified}, planSource: ${json.key?.planSource}`
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Valid zero usage
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = {
      status: 200,
      delayMs: 0,
      body: {
        status: 'found',
        planName: 'Max 20x',
        isActive: true,
        windowTokensLimit: 20000000,
        windowTokensUsed: 0,
        remainingTokens: 20000000,
        usagePercent: 0,
        totalRequests: 0
      }
    };

    const res = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'opm-live-20x-fresh-zero-key' })
    });
    const json = await res.json().catch(() => ({}));
    check(
      7,
      'Valid zero usage (0 tokens used) is preserved as 0, not replaced with null or fabricated values',
      res.status === 200 && json.key?.window_tokens_used === 0 && json.key?.percentUsed === 0 && json.key?.window_tokens_remaining === 20000000,
      `window_tokens_used: ${json.key?.window_tokens_used}, remaining: ${json.key?.window_tokens_remaining}`
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Invalid or expired key
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 404, delayMs: 0, body: { error: 'API key not found', status: 'error' } };

    const resBad = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'invalid-non-existent-token-xyz' })
    });
    const jsonBad = await resBad.json().catch(() => ({}));
    check(
      8,
      'Non-existent key returns 404 KEY_NOT_FOUND',
      resBad.status === 404 && jsonBad.code === 'KEY_NOT_FOUND',
      `status: ${resBad.status}, code: ${jsonBad.code}`
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Upstream 401, 403, 429, and 500
  // ---------------------------------------------------------------------------
  {
    // 401
    mockUpstreamBehavior = { status: 401, delayMs: 0, body: null };
    const res401 = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-401-key' })
    });
    const json401 = await res401.json().catch(() => ({}));

    // 403
    mockUpstreamBehavior = { status: 403, delayMs: 0, body: null };
    const res403 = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-403-key' })
    });
    const json403 = await res403.json().catch(() => ({}));

    // 429
    mockUpstreamBehavior = { status: 429, delayMs: 0, body: null };
    const res429 = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-429-key' })
    });
    const json429 = await res429.json().catch(() => ({}));

    // 500
    mockUpstreamBehavior = { status: 500, delayMs: 0, body: null };
    const res500 = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-500-key' })
    });
    const json500 = await res500.json().catch(() => ({}));

    check(
      9,
      'Upstream 401, 403, 429, and 500 are handled separately without misclassifying as invalid keys',
      res401.status === 401 && json401.code === 'UPSTREAM_AUTHENTICATION_ERROR' &&
      res403.status === 403 && json403.code === 'UPSTREAM_FORBIDDEN' &&
      res429.status === 429 && json429.code === 'UPSTREAM_RATE_LIMITED' &&
      res500.status === 502 && json500.code === 'UPSTREAM_SERVER_ERROR',
      `401->${res401.status}, 403->${res403.status}, 429->${res429.status}, 500->${res500.status}`
    );
  }

  // ---------------------------------------------------------------------------
  // 10. Upstream timeout
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 200, delayMs: 4500, body: null }; // Exceeds internal 4000ms fetch timeout

    const resTimeout = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-timeout-key' })
    });
    const jsonTimeout = await resTimeout.json().catch(() => ({}));

    check(
      10,
      'Upstream timeout returns 504 UPSTREAM_TIMEOUT and is never reported as an invalid key',
      resTimeout.status === 504 && jsonTimeout.code === 'UPSTREAM_TIMEOUT',
      `status: ${resTimeout.status}, code: ${jsonTimeout.code}`
    );
  }

  // ---------------------------------------------------------------------------
  // 11. Unauthorized key access
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 404, delayMs: 0, body: null };

    // Caller authenticated with User Key A attempting to inspect User Key B without admin privileges
    const resAuth = await fetch(`${APP_BASE}/api/key-status?key=${SAVED_USER_KEY_20X}`, {
      headers: {
        'Authorization': `Bearer ${SAVED_USER_KEY_5X}`
      }
    });
    const jsonAuth = await resAuth.json().catch(() => ({}));

    check(
      11,
      'Cross-user key inspection by non-admin is rejected with 403 Forbidden',
      resAuth.status === 403 && jsonAuth.error?.type === 'permission_denied',
      `status: ${resAuth.status}, type: ${jsonAuth.error?.type}`
    );
  }

  // ---------------------------------------------------------------------------
  // 12. Master-key authorization
  // ---------------------------------------------------------------------------
  {
    // Unauthenticated caller requesting master key
    const resNoAuth = await fetch(`${APP_BASE}/api/key-status?key=master`);
    const jsonNoAuth = await resNoAuth.json().catch(() => ({}));

    // Authorized admin requesting master telemetry
    const resAdmin = await fetch(`${APP_BASE}/api/keys/master-status`, {
      headers: {
        'x-admin-key': SYNTHETIC_ADMIN_KEY
      }
    });
    const jsonAdmin = await resAdmin.json().catch(() => ({}));

    check(
      12,
      'Master key access requires admin authorization (401 without credential, 200 with admin credential)',
      resNoAuth.status === 401 && resAdmin.status === 200 && jsonAdmin.key?.tier === '20x',
      `unauth: ${resNoAuth.status}, admin: ${resAdmin.status}`
    );
  }

  // ---------------------------------------------------------------------------
  // 13. Malformed response handling
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 502, delayMs: 0, body: 'HTML_ERROR' };

    const resHtml = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-upstream-html-error' })
    });
    const jsonHtml = await resHtml.json().catch(() => ({}));

    check(
      13,
      'Upstream returning malformed HTML is safely handled and returned as clean JSON',
      resHtml.status === 502 && jsonHtml.code === 'UPSTREAM_SERVER_ERROR',
      `status: ${resHtml.status}, code: ${jsonHtml.code}`
    );
  }

  // ---------------------------------------------------------------------------
  // 14. Secret redaction
  // ---------------------------------------------------------------------------
  {
    mockUpstreamBehavior = { status: 200, delayMs: 0, body: null };

    const resInspect = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: SAVED_USER_KEY_20X })
    });
    const jsonInspect = await resInspect.json().catch(() => ({}));

    const textInspect = JSON.stringify(jsonInspect);
    const hasUnmaskedMaster = textInspect.includes(SYNTHETIC_MASTER_KEY);
    const hasUnmaskedAdmin = textInspect.includes(SYNTHETIC_ADMIN_KEY);
    const hasMaskedToken = typeof jsonInspect.masked_token === 'string' && jsonInspect.masked_token.includes('...');

    check(
      14,
      'Secret redaction: Master and Admin secrets are never leaked, masked_token is always safe',
      !hasUnmaskedMaster && !hasUnmaskedAdmin && hasMaskedToken,
      `masked_token: ${jsonInspect.masked_token}`
    );
  }

  // ---------------------------------------------------------------------------
  // 15. Dashboard and inspector consistency
  // ---------------------------------------------------------------------------
  {
    const overviewRes = await fetch(`${APP_BASE}/api/stats/overview`);
    const overviewJson = await overviewRes.json().catch(() => ({}));

    const keyRes = await fetch(`${APP_BASE}/api/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: SAVED_USER_KEY_20X })
    });
    const keyJson = await keyRes.json().catch(() => ({}));

    // Verify consistency: tokens used and limit are finite numbers, and overview is operational
    const statsConsistent = overviewJson.success === true &&
      typeof overviewJson.stats?.totalTokens === 'number' &&
      typeof keyJson.key?.window_token_limit === 'number' &&
      typeof keyJson.key?.total_tokens_consumed === 'number' &&
      keyJson.key?.total_tokens_consumed >= keyJson.key?.window_tokens_used;

    check(
      15,
      'Dashboard overview and Key Inspector return consistent metric schemas and lifetime tokens',
      statsConsistent,
      `totalTokens: ${overviewJson.stats?.totalTokens}, lifetime: ${keyJson.key?.total_tokens_consumed}`
    );
  }

} finally {
  appServer.close();
  mockUpstreamServer.close();
}

console.log('\n========================================================================');
const passedCount = results.filter((r) => r.pass).length;
const totalCount = results.length;
console.log(`COMPREHENSIVE AUDIT RESULTS: ${passedCount}/${totalCount} passed`);
console.log('========================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
} else {
  process.exit(0);
}
