/**
 * End-to-End Request Trace Verification Script
 * Traces a real gateway request through:
 * 1. Gateway entry (POST /v1/messages)
 * 2. Provider response & token usage extraction
 * 3. Usage persistence in usage_logs and api_keys
 * 4. Quota status API (GET /api/key-status)
 * 5. Verifies: used_tokens + remaining_tokens === quota_limit
 * 6. Verifies that requests older than 5 hours roll off automatically
 */

import http from 'node:http';
import assert from 'node:assert/strict';

// Configure test environment
process.env.UPSTREAM_API_BASE = 'https://upstream.test.local';
delete process.env.SUPABASE_URL;

const { default: app } = await import('../server/server.js');
const { supabase } = await import('../server/lib/supabase.js');

const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const KEY_TOKEN = 'opm-live-20x-trace-test-key';
const KEY_ID = '00000000-0000-0000-0000-00000000020x';
const QUOTA_LIMIT = 20000000; // 20M Authoritative

// Seed a clean 20x key
await supabase.from('api_keys').insert({
  id: KEY_ID,
  name: 'Trace Verification 20x Key',
  key_prefix: 'opm-live-20x',
  key_token: KEY_TOKEN,
  tier: '20x',
  status: 'active',
  rate_limit_rpm: 120,
  rate_limit_tpm: 1000000,
  window_token_limit: QUOTA_LIMIT,
  window_tokens_used: 0,
  window_started_at: new Date().toISOString(),
  window_resets_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
  total_tokens_consumed: 0,
  total_requests: 0,
  created_at: new Date().toISOString()
});

console.log('--- 1. INITIAL KEY STATUS BEFORE REQUEST ---');
const initStatusRes = await fetch(`${BASE}/api/key-status?key=${KEY_TOKEN}`);
const initStatus = await initStatusRes.json();

console.log('Initial Quota Limit:', initStatus.key.window_token_limit);
console.log('Initial Tokens Used:', initStatus.key.window_tokens_used);
console.log('Initial Tokens Remaining:', initStatus.key.window_tokens_remaining);
console.log('Initial Usage %:', initStatus.key.percentUsed);
console.log('Initial Remaining %:', initStatus.key.percentRemaining);
console.log('Initial Invariant Valid:', initStatus.key.window_tokens_used + initStatus.key.window_tokens_remaining === initStatus.key.window_token_limit);

assert.equal(initStatus.key.window_tokens_used, 0);
assert.equal(initStatus.key.window_tokens_remaining, QUOTA_LIMIT);
assert.equal(initStatus.key.percentUsed, 0);
assert.equal(initStatus.key.percentRemaining, 100);

console.log('\n--- 2. SENDING REAL REQUEST THROUGH GATEWAY ---');
// Mock upstream response for this request
const promptTokens = 12500;
const completionTokens = 3500;
const totalExpected = promptTokens + completionTokens; // 16,000

const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    return realFetch(input, init);
  }
  if (url.includes('/v1/messages')) {
    return new Response(JSON.stringify({
      id: 'msg_trace_001',
      type: 'message',
      role: 'assistant',
      model: 'claude-opus-5-5',
      content: [{ type: 'text', text: 'Hello, this is a traced response.' }],
      usage: {
        input_tokens: promptTokens,
        output_tokens: completionTokens,
        cache_read_input_tokens: 2400
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
};

const gatewayRes = await fetch(`${BASE}/v1/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': KEY_TOKEN,
    'x-request-id': 'req-trace-001'
  },
  body: JSON.stringify({
    model: 'claude-opus-5-5',
    messages: [{ role: 'user', content: 'Say hello' }]
  })
});

console.log('Gateway Response Status:', gatewayRes.status);
const gatewayBody = await gatewayRes.json();
console.log('Provider-reported Input Tokens:', gatewayBody.usage?.input_tokens);
console.log('Provider-reported Output Tokens:', gatewayBody.usage?.output_tokens);

// Give async logging microtask time to persist
await new Promise((r) => setTimeout(r, 200));

console.log('\n--- 3. KEY STATUS AFTER REQUEST ---');
const postStatusRes = await fetch(`${BASE}/api/key-status?key=${KEY_TOKEN}`);
const postStatus = await postStatusRes.json();

console.log('Post-Request Quota Limit:', postStatus.key.window_token_limit);
console.log('Post-Request Tokens Used:', postStatus.key.window_tokens_used);
console.log('Post-Request Tokens Remaining:', postStatus.key.window_tokens_remaining);
console.log('Post-Request Usage %:', postStatus.key.percentUsed);
console.log('Post-Request Remaining %:', postStatus.key.percentRemaining);
console.log('Post-Request byModel:', postStatus.key.byModel);

assert.equal(postStatus.key.window_tokens_used, totalExpected);
assert.equal(postStatus.key.window_tokens_remaining, QUOTA_LIMIT - totalExpected);
assert.equal(postStatus.key.window_tokens_used + postStatus.key.window_tokens_remaining, QUOTA_LIMIT);
assert.ok(postStatus.key.byModel['claude-opus-5-5']);
assert.equal(postStatus.key.byModel['claude-opus-5-5'].tokens, totalExpected);

console.log('\n--- 4. SLIDING WINDOW ROLL-OFF TEST (> 5 HOURS) ---');
// Backdate the log record by 5 hours and 5 minutes
const oldTime = new Date(Date.now() - (5 * 60 + 5) * 60 * 1000).toISOString();
const { data: logs } = await supabase.from('usage_logs').select('*').eq('key_id', KEY_ID);
if (logs && logs.length > 0) {
  logs[0].created_at = oldTime;
}

const rolledStatusRes = await fetch(`${BASE}/api/key-status?key=${KEY_TOKEN}`);
const rolledStatus = await rolledStatusRes.json();

console.log('Rolled Tokens Used (after 5h elapses):', rolledStatus.key.window_tokens_used);
console.log('Rolled Tokens Remaining (replenished):', rolledStatus.key.window_tokens_remaining);
console.log('Rolled Invariant Valid:', rolledStatus.key.window_tokens_used + rolledStatus.key.window_tokens_remaining === QUOTA_LIMIT);

assert.equal(rolledStatus.key.window_tokens_used, 0);
assert.equal(rolledStatus.key.window_tokens_remaining, QUOTA_LIMIT);
assert.equal(rolledStatus.key.percentUsed, 0);
assert.equal(rolledStatus.key.percentRemaining, 100);

await srv.close();
console.log('\n✓ END-TO-END TRACE VERIFICATION COMPLETE & PASSED!\n');
