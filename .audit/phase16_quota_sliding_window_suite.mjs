/**
 * Phase 16: Comprehensive API Token Quota & Sliding Window Automated Test Suite
 * 
 * Tests all 18 requirements:
 * 1. Zero token usage (0-safe, no fake defaults).
 * 2. Prompt tokens only.
 * 3. Completion tokens only.
 * 4. Combined prompt and completion tokens.
 * 5. Request inside the 5-hour window.
 * 6. Request older than 5 hours (smoothly leaves window).
 * 7. Request exactly at the window boundary.
 * 8. Remaining quota reaching zero (exact match).
 * 9. Usage exceeding quota (over-quota reporting).
 * 10. Missing provider usage metadata (hasUsage: false, 0 tokens).
 * 11. Streaming SSE responses with TCP fragmentation & line buffering.
 * 12. Duplicate usage events and retry idempotency.
 * 13. Concurrent requests with mutex locking.
 * 14. Key and user isolation (Key A vs. Key B).
 * 15. Model breakdown (byModel aggregation).
 * 16. Timezone consistency (ISO 8601 UTC & offset parsing).
 * 17. TPM burst limit separation from 5H window quota.
 * 18. Mathematical invariant: used_tokens + remaining_tokens === quota_limit.
 */

import assert from 'node:assert/strict';
import {
  calculateSlidingWindowUsage,
  recordRequestUsage,
  extractAnthropicTokens,
  extractOpenAiTokens,
  createStreamUsageParser,
  isRequestRecorded,
  markRequestRecorded
} from '../server/lib/quotaEngine.js';
import { supabase } from '../server/lib/supabase.js';
import { quotaFor } from '../server/lib/quotas.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('--- PHASE 16: TOKEN QUOTA & SLIDING WINDOW TEST SUITE ---');
console.log('======================================================\n');

// 1. Zero token usage
await test('1. Zero token usage extracted correctly without fake 50/100 defaults', () => {
  const anthropicRes = { usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 } };
  const extracted = extractAnthropicTokens(anthropicRes);
  assert.equal(extracted.inputTokens, 0);
  assert.equal(extracted.outputTokens, 0);
  assert.equal(extracted.cachedTokens, 0);
  assert.equal(extracted.totalTokens, 0);
  assert.equal(extracted.hasUsage, true);

  const openaiRes = { usage: { prompt_tokens: 0, completion_tokens: 0 } };
  const extractedOai = extractOpenAiTokens(openaiRes);
  assert.equal(extractedOai.inputTokens, 0);
  assert.equal(extractedOai.outputTokens, 0);
  assert.equal(extractedOai.totalTokens, 0);
  assert.equal(extractedOai.hasUsage, true);
});

// 2. Prompt tokens only
await test('2. Prompt tokens only correctly extracted and aggregated', () => {
  const res = { usage: { input_tokens: 3500, output_tokens: 0 } };
  const extracted = extractAnthropicTokens(res);
  assert.equal(extracted.inputTokens, 3500);
  assert.equal(extracted.outputTokens, 0);
  assert.equal(extracted.totalTokens, 3500);
});

// 3. Completion tokens only
await test('3. Completion tokens only correctly extracted and aggregated', () => {
  const res = { usage: { input_tokens: 0, output_tokens: 1800 } };
  const extracted = extractAnthropicTokens(res);
  assert.equal(extracted.inputTokens, 0);
  assert.equal(extracted.outputTokens, 1800);
  assert.equal(extracted.totalTokens, 1800);
});

// 4. Combined prompt and completion tokens
await test('4. Combined prompt and completion tokens exact sum', () => {
  const res = { usage: { input_tokens: 12500, output_tokens: 4200, cache_read_input_tokens: 8000 } };
  const extracted = extractAnthropicTokens(res);
  assert.equal(extracted.inputTokens, 12500);
  assert.equal(extracted.outputTokens, 4200);
  assert.equal(extracted.cachedTokens, 8000);
  assert.equal(extracted.totalTokens, 16700);
});

// 5 & 6 & 7. Sliding 5-hour window: inside, outside, boundary
await test('5-7. Sliding 5-hour window: records inside vs outside vs boundary', async () => {
  const testKeyId = 'test-sliding-key-001';
  const testKey = {
    id: testKeyId,
    key_token: 'test-token-sliding',
    tier: '20x',
    window_token_limit: 200000000
  };

  const now = new Date('2026-10-17T12:00:00.000Z');

  // Insert test usage logs at various offsets:
  // Log A: 2 hours ago (inside window) -> 5,000 tokens
  // Log B: 4 hours 59 minutes ago (inside window) -> 10,000 tokens
  // Log C: exactly 5 hours ago (boundary) -> 15,000 tokens
  // Log D: 5 hours 1 minute ago (outside window) -> 20,000 tokens
  // Log E: 12 hours ago (outside window) -> 50,000 tokens
  // Log F: 1 hour ago but failed with 500 error (should NOT count) -> 30,000 tokens

  await supabase.from('usage_logs').insert([
    {
      key_id: testKeyId,
      model: 'claude-3-5-sonnet-20241022',
      input_tokens: 4000,
      output_tokens: 1000,
      status_code: 200,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      key_id: testKeyId,
      model: 'claude-3-5-sonnet-20241022',
      input_tokens: 8000,
      output_tokens: 2000,
      status_code: 200,
      created_at: new Date(now.getTime() - (4 * 60 + 59) * 60 * 1000).toISOString()
    },
    {
      key_id: testKeyId,
      model: 'claude-3-opus-20240229',
      input_tokens: 12000,
      output_tokens: 3000,
      status_code: 200,
      created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString() // exact boundary
    },
    {
      key_id: testKeyId,
      model: 'claude-3-opus-20240229',
      input_tokens: 16000,
      output_tokens: 4000,
      status_code: 200,
      created_at: new Date(now.getTime() - (5 * 60 + 1) * 60 * 1000).toISOString() // 5h 1m ago
    },
    {
      key_id: testKeyId,
      model: 'claude-3-opus-20240229',
      input_tokens: 40000,
      output_tokens: 10000,
      status_code: 200,
      created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() // 12h ago
    },
    {
      key_id: testKeyId,
      model: 'claude-3-5-sonnet-20241022',
      input_tokens: 25000,
      output_tokens: 5000,
      status_code: 500, // Failed request
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });

  // Eligible inside window: Log A (5,000) + Log B (10,000) + Log C (15,000) = 30,000 tokens
  // Log D (20,000), Log E (50,000), Log F (failed 30,000) must NOT be included!
  assert.equal(metrics.used_tokens, 30000, `Expected 30000 used tokens, got ${metrics.used_tokens}`);
  assert.equal(metrics.quota_limit, 20000000);
  assert.equal(metrics.remaining_tokens, 20000000 - 30000);
  assert.equal(metrics.total_requests_in_window, 3);
  assert.equal(metrics.is_over_quota, false);
});

// 8. Remaining quota reaching zero (exact limit reached)
await test('8. Remaining quota reaching exactly zero', async () => {
  const testKey = {
    id: 'test-key-zero-remain',
    key_token: 'test-token-zero',
    tier: '5x',
    window_token_limit: 100000
  };

  const now = new Date('2026-10-17T14:00:00.000Z');
  await supabase.from('usage_logs').insert([
    {
      key_id: testKey.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 70000,
      output_tokens: 30000,
      status_code: 200,
      created_at: new Date(now.getTime() - 60000).toISOString()
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });
  assert.equal(metrics.used_tokens, 100000);
  assert.equal(metrics.remaining_tokens, 0);
  assert.equal(metrics.usage_percentage, 100);
  assert.equal(metrics.remaining_percentage, 0);
  assert.equal(metrics.is_over_quota, false);
  assert.equal(metrics.over_quota_tokens, 0);
});

// 9. Usage exceeding quota (over-quota reporting)
await test('9. Usage exceeding quota correctly sets remaining to 0 and reports overQuota', async () => {
  const testKey = {
    id: 'test-key-over-quota',
    key_token: 'test-token-over',
    tier: '5x',
    window_token_limit: 50000
  };

  const now = new Date('2026-10-17T14:00:00.000Z');
  await supabase.from('usage_logs').insert([
    {
      key_id: testKey.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 45000,
      output_tokens: 15000,
      status_code: 200,
      created_at: new Date(now.getTime() - 60000).toISOString()
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });
  assert.equal(metrics.used_tokens, 60000);
  assert.equal(metrics.remaining_tokens, 0);
  assert.equal(metrics.over_quota_tokens, 10000);
  assert.equal(metrics.is_over_quota, true);
  assert.equal(metrics.usage_percentage, 100);
});

// 10. Missing provider usage metadata
await test('10. Missing provider usage metadata defaults to 0 and flags hasUsage=false', () => {
  const missingAnthropic = extractAnthropicTokens({});
  assert.equal(missingAnthropic.inputTokens, 0);
  assert.equal(missingAnthropic.outputTokens, 0);
  assert.equal(missingAnthropic.hasUsage, false);

  const missingOpenAi = extractOpenAiTokens(null);
  assert.equal(missingOpenAi.inputTokens, 0);
  assert.equal(missingOpenAi.outputTokens, 0);
  assert.equal(missingOpenAi.hasUsage, false);
});

// 11. Streaming responses and final usage events with line buffering
await test('11. Streaming SSE parser buffers fragmented TCP chunks without dropping tokens', () => {
  const parser = createStreamUsageParser('anthropic');

  // Fragment 1: cuts halfway through message_start
  parser.pushChunk('data: {"type":"message_start","message":{"id":"msg_1","type":"message","usage":{"input_');
  // Fragment 2: supplies the rest of input_tokens and starts text delta
  parser.pushChunk('tokens":1450,"cache_read_input_tokens":500}}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta"');
  // Fragment 3: ends delta and gives fragmented message_delta
  parser.pushChunk('}\n\ndata: {"type":"message_delta","usage":{"output_');
  // Fragment 4: finishes output_tokens
  parser.pushChunk('tokens":620}}\n\ndata: [DONE]\n\n');

  const usage = parser.getUsage();
  assert.equal(usage.inputTokens, 1450);
  assert.equal(usage.outputTokens, 620);
  assert.equal(usage.cachedTokens, 500);
  assert.equal(usage.totalTokens, 2070);
  assert.equal(usage.hasUsage, true);
});

// 12. Duplicate usage events and retries (idempotency)
await test('12. Duplicate request IDs are rejected from re-counting (idempotency)', async () => {
  const testKey = {
    id: 'test-key-idempotent',
    key_token: 'test-token-idem',
    tier: '20x',
    window_token_limit: 200000000,
    total_tokens_consumed: 0,
    total_requests: 0
  };

  const reqId = 'req-unique-998877';

  // First attempt
  const res1 = await recordRequestUsage({
    keyRecord: testKey,
    model: 'claude-sonnet-4-6',
    inputTokens: 1000,
    outputTokens: 500,
    requestId: reqId
  });
  assert.equal(res1.success, true);
  assert.equal(testKey.total_tokens_consumed, 1500);
  assert.equal(testKey.total_requests, 1);

  // Duplicate retry with same requestId
  const res2 = await recordRequestUsage({
    keyRecord: testKey,
    model: 'claude-sonnet-4-6',
    inputTokens: 1000,
    outputTokens: 500,
    requestId: reqId
  });
  assert.equal(res2.duplicate, true);
  // Total tokens and requests must NOT increase!
  assert.equal(testKey.total_tokens_consumed, 1500);
  assert.equal(testKey.total_requests, 1);
});

// 13. Concurrent requests with mutex locking
await test('13. Concurrent requests handled atomically without race conditions', async () => {
  const testKey = {
    id: 'test-key-concurrent',
    key_token: 'test-token-concurrent',
    tier: '20x',
    window_token_limit: 200000000,
    total_tokens_consumed: 0,
    total_requests: 0
  };

  // Launch 10 concurrent requests of 200 tokens each
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      recordRequestUsage({
        keyRecord: testKey,
        model: 'claude-sonnet-4-6',
        inputTokens: 150,
        outputTokens: 50,
        requestId: `req-concurrent-${i}`
      })
    );
  }

  await Promise.all(promises);

  assert.equal(testKey.total_tokens_consumed, 2000);
  assert.equal(testKey.total_requests, 10);
});

// 14. Different users and API keys isolation
await test('14. Per-key isolation: Key A usage does not affect Key B', async () => {
  const keyA = {
    id: 'key-isolation-A',
    key_token: 'token-A',
    tier: '20x',
    window_token_limit: 200000000
  };
  const keyB = {
    id: 'key-isolation-B',
    key_token: 'token-B',
    tier: '20x',
    window_token_limit: 200000000
  };

  const now = new Date();
  await supabase.from('usage_logs').insert([
    {
      key_id: keyA.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 50000,
      output_tokens: 25000,
      status_code: 200,
      created_at: now.toISOString()
    }
  ]);

  const metricsA = await calculateSlidingWindowUsage(keyA, { now });
  const metricsB = await calculateSlidingWindowUsage(keyB, { now });

  assert.equal(metricsA.used_tokens, 75000);
  assert.equal(metricsB.used_tokens, 0);
  assert.equal(metricsB.remaining_tokens, 20000000);
});

// 15. Model breakdown (byModel aggregation)
await test('15. byModel accurately aggregates model token shares and percentages', async () => {
  const testKey = {
    id: 'test-key-models',
    key_token: 'token-models',
    tier: '20x',
    window_token_limit: 20000000
  };

  const now = new Date();
  await supabase.from('usage_logs').insert([
    {
      key_id: testKey.id,
      model: 'claude-opus-5-5',
      input_tokens: 60000,
      output_tokens: 20000, // 80,000 (80%)
      status_code: 200,
      created_at: now.toISOString()
    },
    {
      key_id: testKey.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 15000,
      output_tokens: 5000, // 20,000 (20%)
      status_code: 200,
      created_at: now.toISOString()
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });
  assert.equal(metrics.used_tokens, 100000);
  assert.ok(metrics.byModel['claude-opus-5-5']);
  assert.ok(metrics.byModel['claude-sonnet-4-6']);
  assert.equal(metrics.byModel['claude-opus-5-5'].tokens, 80000);
  assert.equal(metrics.byModel['claude-opus-5-5'].percent, 80);
  assert.equal(metrics.byModel['claude-sonnet-4-6'].tokens, 20000);
  assert.equal(metrics.byModel['claude-sonnet-4-6'].percent, 20);
});

// 16. Timezone consistency
await test('16. Consistent epoch-based comparison across different timezone representations', async () => {
  const testKey = {
    id: 'test-key-tz',
    key_token: 'token-tz',
    tier: '20x',
    window_token_limit: 20000000
  };

  // 12:00 UTC
  const now = new Date('2026-10-17T12:00:00.000Z');
  // 1 hour ago represented in +05:30 offset
  const tzOneHourAgo = '2026-10-17T16:30:00.000+05:30'; // equivalent to 11:00 UTC

  await supabase.from('usage_logs').insert([
    {
      key_id: testKey.id,
      model: 'claude-sonnet-4-6',
      input_tokens: 3000,
      output_tokens: 1000,
      status_code: 200,
      created_at: tzOneHourAgo
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });
  assert.equal(metrics.used_tokens, 4000);
});

// 17. TPM burst limit separation from 5H window quota
await test('17. TPM burst capacity (1M TPM) is strictly distinguished from 5H quota (20M)', () => {
  const tier20x = quotaFor('20x');
  assert.equal(tier20x.limit, 20000000, '20x 5-hour quota must be 20,000,000 tokens');
  assert.equal(tier20x.tpm, 1000000, '20x burst limit must be 1,000,000 TPM');
  assert.notEqual(tier20x.limit, tier20x.tpm, 'TPM burst limit must not be confused with 5-hour quota limit');

  const tier5x = quotaFor('5x');
  assert.equal(tier5x.limit, 5000000, '5x 5-hour quota must be 5,000,000 tokens');
  assert.equal(tier5x.tpm, 400000, '5x burst limit must be 400,000 TPM');
});

// 18. Mathematical Invariant: used_tokens + remaining_tokens === quota_limit
await test('18. Invariant holds: used_tokens + remaining_tokens === quota_limit', async () => {
  const testKey = {
    id: 'test-key-invariant',
    key_token: 'token-inv',
    tier: '20x',
    window_token_limit: 20000000
  };

  const now = new Date();
  await supabase.from('usage_logs').insert([
    {
      key_id: testKey.id,
      model: 'claude-opus-5-5',
      input_tokens: 1845012,
      output_tokens: 934988, // sum = 2,780,000 (13.9% of 20,000,000)
      status_code: 200,
      created_at: now.toISOString()
    }
  ]);

  const metrics = await calculateSlidingWindowUsage(testKey, { now });
  assert.equal(metrics.used_tokens, 2780000);
  assert.equal(metrics.remaining_tokens, 17220000);
  assert.equal(metrics.quota_limit, 20000000);
  assert.equal(metrics.used_tokens + metrics.remaining_tokens, metrics.quota_limit);
  assert.equal(metrics.usage_percentage, 13.9);
  assert.equal(metrics.remaining_percentage, 86.1);
});

console.log(`\n======================================================`);
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
