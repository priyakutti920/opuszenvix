/**
 * OpusZyra - Max 5x Plan Quota 5M Tokens Comprehensive Regression Suite
 * 
 * Verifies:
 * 1. Authoritative Max 5x quota is exactly 5,000,000 tokens per 5-hour rolling window.
 * 2. Tier normalization for '5x', 'max_5x', 'max-5x', and '5x_trial'.
 * 3. Max 20x plan quota remains completely unchanged at 20,000,000 tokens.
 * 4. RPM limits (60 for 5x, 120 for 20x) and TPM limits (400K for 5x, 1M for 20x) remain intact.
 * 5. Newly created Max 5x keys receive 5,000,000 token limit.
 * 6. Existing Max 5x keys with legacy 25M or 2.5M limits are properly normalized to 5M.
 * 7. Existing usage is never reset or duplicated when reading or normalizing keys.
 * 8. Sliding 5-hour window token math invariant: used + remaining === limit.
 * 9. Rolling window resets: events older than 5 hours drop out of window usage.
 * 10. Missing, invalid, or typo tier inputs fail-safe to 5x with 5M limit (cannot grant higher tier).
 * 11. Mock seed key and database schema default consistently specify 5,000,000.
 */

import assert from 'node:assert/strict';
import { TIER_QUOTAS, DEFAULT_TIER, normalizeTier, quotaFor, isLegacyStaleOverride } from '../server/lib/quotas.js';
import {
  calculateSlidingWindowUsage,
  WINDOW_DURATION_MS,
  recordRequestUsage,
  parseTokenValue
} from '../server/lib/quotaEngine.js';
import { evaluateRollingWindow } from '../server/routes/keys.js';
import { supabase } from '../server/lib/supabase.js';

let passed = 0;
let failed = 0;

function runSyncTest(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('--- OPUSZYRA MAX 5X 5M QUOTA REGRESSION SUITE ---');

// Test 1: Authoritative Max 5x quota definition
runSyncTest('1. Authoritative 5x quota equals exactly 5,000,000 tokens', () => {
  const q5x = quotaFor('5x');
  assert.equal(q5x.limit, 5000000, '5x limit must be 5,000,000');
  assert.equal(q5x.rpm, 60, '5x RPM must be 60');
  assert.equal(q5x.tpm, 400000, '5x TPM must be 400,000');
  assert.equal(q5x.durationDays, 30, '5x duration must be 30 days');
});

// Test 2: 5x_trial and custom tiers
runSyncTest('2. 5x_trial and custom tiers receive 5,000,000 tokens', () => {
  const qTrial = quotaFor('5x_trial');
  assert.equal(qTrial.limit, 5000000, '5x_trial limit must be 5,000,000');
  assert.equal(qTrial.durationDays, 7, '5x_trial duration must be 7 days');

  const qCustom = quotaFor('custom');
  assert.equal(qCustom.limit, 5000000, 'custom fallback limit must be 5,000,000');
});

// Test 3: max_5x and max-5x aliases
runSyncTest('3. max_5x and max-5x aliases normalize to 5x with 5,000,000 tokens', () => {
  assert.equal(normalizeTier('max_5x'), '5x');
  assert.equal(normalizeTier('MAX_5X'), '5x');
  assert.equal(normalizeTier('max-5x'), '5x');
  assert.equal(quotaFor('max_5x').limit, 5000000);
});

// Test 4: Max 20x plan quota remains unchanged at 20,000,000
runSyncTest('4. Max 20x plan quota remains untouched at 20,000,000 tokens', () => {
  const q20x = quotaFor('20x');
  assert.equal(q20x.limit, 20000000, '20x limit must remain 20,000,000');
  assert.equal(q20x.rpm, 120, '20x RPM must remain 120');
  assert.equal(q20x.tpm, 1000000, '20x TPM burst must remain 1,000,000');
  assert.equal(normalizeTier('max_20x'), '20x');
  assert.equal(quotaFor('max_20x').limit, 20000000);
});

// Test 5: Legacy stale override detection
runSyncTest('5. isLegacyStaleOverride accurately detects 25M, 2.5M, 100M, and 200M stale values', () => {
  // For 5x tier:
  assert.equal(isLegacyStaleOverride('5x', 25000000), true, '25M for 5x is stale');
  assert.equal(isLegacyStaleOverride('5x', 2500000), true, '2.5M for 5x is stale');
  assert.equal(isLegacyStaleOverride('5x', 100000000), true, '100M for 5x is stale');
  assert.equal(isLegacyStaleOverride('5x', 200000000), true, '200M for 5x is stale');
  assert.equal(isLegacyStaleOverride('5x', 5000000), false, '5M for 5x is authoritative, not stale');
  assert.equal(isLegacyStaleOverride('max_5x', 25000000), true, '25M for max_5x is stale');

  // For 20x tier:
  assert.equal(isLegacyStaleOverride('20x', 100000000), true, '100M for 20x is stale');
  assert.equal(isLegacyStaleOverride('20x', 200000000), true, '200M for 20x is stale');
  assert.equal(isLegacyStaleOverride('20x', 20000000), false, '20M for 20x is authoritative');

  // Valid custom enterprise limits (e.g. 50,000,000) must not be rejected:
  assert.equal(isLegacyStaleOverride('custom', 50000000), false, 'Custom enterprise 50M limit is preserved');
});

// Test 6: evaluateRollingWindow handles new 5x key
runSyncTest('6. evaluateRollingWindow assigns 5M limit to newly created 5x key', () => {
  const newKey = {
    key_token: 'opm-live-5x-new-key-1',
    tier: '5x',
    window_tokens_used: 0
  };
  const evaluated = evaluateRollingWindow(newKey);
  assert.equal(evaluated.window_token_limit, 5000000);
  assert.equal(evaluated.window_tokens_remaining, 5000000);
  assert.equal(evaluated.percentUsed, 0);
  assert.equal(evaluated.percentRemaining, 100);
});

// Test 7: evaluateRollingWindow normalizes existing key with legacy 25M limit without resetting usage
runSyncTest('7. evaluateRollingWindow normalizes legacy 25M key to 5M preserving existing usage', () => {
  const existingKey = {
    id: 'key-existing-legacy-25m',
    key_token: 'opm-live-5x-legacy',
    tier: '5x',
    window_token_limit: 25000000, // Legacy stale limit
    window_tokens_used: 1250000 // 1.25M tokens consumed
  };
  const evaluated = evaluateRollingWindow(existingKey);
  assert.equal(evaluated.window_token_limit, 5000000, 'Limit normalized to 5M');
  assert.equal(evaluated.window_tokens_used, 1250000, 'Usage preserved, not reset');
  assert.equal(evaluated.window_tokens_remaining, 3750000, 'Remaining is 5M - 1.25M = 3.75M');
  assert.equal(evaluated.percentUsed, 25.0, 'Used percent is 25.0%');
  assert.equal(evaluated.percentRemaining, 75.0, 'Remaining percent is 75.0%');
});

// Test 8: evaluateRollingWindow normalizes existing key with legacy 2.5M limit
runSyncTest('8. evaluateRollingWindow normalizes legacy 2.5M key to 5M', () => {
  const existingKey = {
    id: 'key-existing-legacy-2_5m',
    key_token: 'opm-live-5x-legacy-25',
    tier: '5x',
    window_token_limit: 2500000, // Legacy 2.5M limit
    window_tokens_used: 500000
  };
  const evaluated = evaluateRollingWindow(existingKey);
  assert.equal(evaluated.window_token_limit, 5000000);
  assert.equal(evaluated.window_tokens_remaining, 4500000);
  assert.equal(evaluated.percentUsed, 10.0);
});

// Test 9: calculateSlidingWindowUsage normalizes legacy 5x keys and calculates sliding window math
await runAsyncTest('9. calculateSlidingWindowUsage calculates correct 5M math with usage logs', async () => {
  const keyRecord = {
    id: 'key-sliding-5m-test',
    key_token: 'opm-live-5x-sliding-test',
    tier: '5x',
    window_token_limit: 25000000 // Legacy value in DB
  };

  const now = new Date();
  // Insert 2 recent logs within the 5-hour window
  await supabase.from('usage_logs').insert([
    {
      key_id: keyRecord.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 1500000,
      output_tokens: 500000,
      status_code: 200,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 mins ago
    },
    {
      key_id: keyRecord.id,
      model: 'claude-haiku-4-5',
      input_tokens: 400000,
      output_tokens: 100000,
      status_code: 200,
      created_at: new Date(now.getTime() - 90 * 60 * 1000).toISOString() // 1.5 hrs ago
    }
  ]);

  const res = await calculateSlidingWindowUsage(keyRecord, { now });
  assert.equal(res.quota_limit, 5000000, 'Quota limit must be 5M tokens');
  assert.equal(res.used_tokens, 2500000, 'Used tokens = 2M + 0.5M = 2.5M');
  assert.equal(res.remaining_tokens, 2500000, 'Remaining tokens = 5M - 2.5M = 2.5M');
  assert.equal(res.usage_percentage, 50.0, 'Usage percentage = 50.0%');
  assert.equal(res.remaining_percentage, 50.0, 'Remaining percentage = 50.0%');
  assert.equal(res.is_over_quota, false);
  assert.equal(res.used_tokens + res.remaining_tokens, res.quota_limit, 'Invariant used + remaining === limit');
});

// Test 10: 5-hour rolling window boundary (events older than 5 hours drop out)
await runAsyncTest('10. 5-hour rolling window expiration drops events older than 5 hours', async () => {
  const keyRecord = {
    id: 'key-window-expire-5m',
    key_token: 'opm-live-5x-expire',
    tier: '5x',
    window_token_limit: 5000000
  };

  const now = new Date();
  // Insert 1 log within window (1 hour ago) and 1 log outside window (5 hours 10 mins ago)
  await supabase.from('usage_logs').insert([
    {
      key_id: keyRecord.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 750000,
      output_tokens: 250000, // 1M tokens
      status_code: 200,
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    },
    {
      key_id: keyRecord.id,
      model: 'claude-opus-5-5',
      input_tokens: 3000000,
      output_tokens: 1000000, // 4M tokens, outside window
      status_code: 200,
      created_at: new Date(now.getTime() - (5 * 60 + 10) * 60 * 1000).toISOString()
    }
  ]);

  const res = await calculateSlidingWindowUsage(keyRecord, { now });
  assert.equal(res.used_tokens, 1000000, 'Only recent 1M log is counted');
  assert.equal(res.remaining_tokens, 4000000, 'Remaining is 5M - 1M = 4M');
  assert.equal(res.usage_percentage, 20.0);
});

// Test 11: Fail-safe tier fallback for typos/unrecognized tier strings
runSyncTest('11. Unrecognized tier strings fall back to 5x with 5,000,000 tokens', () => {
  assert.equal(normalizeTier('20Ox'), '5x', 'Typo cannot mint 20x');
  assert.equal(normalizeTier('admin_super_tier'), '5x');
  assert.equal(normalizeTier(null), '5x');
  assert.equal(normalizeTier(undefined), '5x');
  assert.equal(normalizeTier(12345), '5x');
  assert.equal(quotaFor('invalid').limit, 5000000, 'Never mints larger than 5M on invalid input');
});

// Test 12: Mock database seed key #1 has 5,000,000 limit
await runAsyncTest('12. In-memory fallback mock database seeds 5x key with 5,000,000 limit', async () => {
  const { data: seedKey } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .maybeSingle();

  assert.ok(seedKey, 'Seed key 1 must exist');
  assert.equal(seedKey.tier, '5x');
  assert.equal(seedKey.window_token_limit, 5000000, 'Seed key 1 limit must be 5,000,000');
  assert.equal(seedKey.window_tokens_used, 4280500, 'Usage preserved');
});

console.log(`\nMax 5x Quota Regression Suite Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
