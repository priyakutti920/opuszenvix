/**
 * OpusZyra Authoritative Quota & Rolling 5-Hour Window Calculation Engine
 * 
 * Provides:
 * 1. Strict extraction of provider-reported input/prompt & output/completion tokens (0-safe).
 * 2. True sliding 5-hour rolling window usage aggregation over eligible usage logs.
 * 3. Exact quota math: used_tokens + remaining_tokens = quota_limit (when within quota).
 * 4. Distinct handling for 1M TPM burst capacity vs. 200M 5-hour quota allowance.
 * 5. Concurrent request atomicity and idempotency protection against duplicate event counting.
 * 6. Streaming SSE line buffering to eliminate dropped token usage events across TCP packet chunks.
 */

import { supabase } from './supabase.js';
import { quotaFor, isLegacyStaleOverride, normalizeTier } from './quotas.js';

export const WINDOW_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// Idempotency tracking to prevent duplicate usage counting on retries / duplicate callbacks
const recentRequests = new Map(); // requestId -> { timestamp, tokens }
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Per-key mutex to ensure atomic usage logging during high concurrency
const keyMutexes = new Map();

/**
 * Acquire in-memory lock for a key to serialize concurrent updates
 */
async function acquireKeyLock(keyId) {
  while (keyMutexes.has(keyId)) {
    await keyMutexes.get(keyId);
  }
  let unlock;
  const promise = new Promise((resolve) => {
    unlock = resolve;
  });
  keyMutexes.set(keyId, promise);
  return () => {
    keyMutexes.delete(keyId);
    unlock();
  };
}

/**
 * Clean up expired idempotency keys
 */
function cleanupIdempotency() {
  const now = Date.now();
  for (const [reqId, data] of recentRequests.entries()) {
    if (now - data.timestamp > IDEMPOTENCY_TTL_MS) {
      recentRequests.delete(reqId);
    }
  }
}

/**
 * Check if a request was already recorded
 */
export function isRequestRecorded(requestId) {
  if (!requestId) return false;
  cleanupIdempotency();
  return recentRequests.has(requestId);
}

/**
 * Mark a request as recorded with its token cost
 */
export function markRequestRecorded(requestId, tokens) {
  if (!requestId) return;
  recentRequests.set(requestId, { timestamp: Date.now(), tokens });
}

/**
 * Extract authoritative token counts from Anthropic API response format
 * Never fabricates 50 or 100 defaults when actual values are 0.
 */
export function extractAnthropicTokens(data) {
  if (!data || typeof data !== 'object') {
    return { inputTokens: 0, outputTokens: 0, cachedTokens: 0, hasUsage: false, isEstimated: false };
  }

  const usage = data.usage;
  const hasUsage = Boolean(usage && typeof usage === 'object');

  const inputTokens = hasUsage && typeof usage.input_tokens === 'number' && Number.isFinite(usage.input_tokens)
    ? Math.max(0, Math.floor(usage.input_tokens))
    : 0;

  const outputTokens = hasUsage && typeof usage.output_tokens === 'number' && Number.isFinite(usage.output_tokens)
    ? Math.max(0, Math.floor(usage.output_tokens))
    : 0;

  const cachedTokens = hasUsage && typeof usage.cache_read_input_tokens === 'number' && Number.isFinite(usage.cache_read_input_tokens)
    ? Math.max(0, Math.floor(usage.cache_read_input_tokens))
    : 0;

  return {
    inputTokens,
    outputTokens,
    cachedTokens,
    totalTokens: inputTokens + outputTokens,
    hasUsage,
    isEstimated: false
  };
}

/**
 * Extract authoritative token counts from OpenAI API response format (/v1/chat/completions)
 */
export function extractOpenAiTokens(data) {
  if (!data || typeof data !== 'object') {
    return { inputTokens: 0, outputTokens: 0, cachedTokens: 0, hasUsage: false, isEstimated: false };
  }

  const usage = data.usage;
  const hasUsage = Boolean(usage && typeof usage === 'object');

  const inputTokens = hasUsage && typeof usage.prompt_tokens === 'number' && Number.isFinite(usage.prompt_tokens)
    ? Math.max(0, Math.floor(usage.prompt_tokens))
    : 0;

  const outputTokens = hasUsage && typeof usage.completion_tokens === 'number' && Number.isFinite(usage.completion_tokens)
    ? Math.max(0, Math.floor(usage.completion_tokens))
    : 0;

  const cachedTokens = hasUsage && usage.prompt_tokens_details && typeof usage.prompt_tokens_details.cached_tokens === 'number'
    ? Math.max(0, Math.floor(usage.prompt_tokens_details.cached_tokens))
    : 0;

  return {
    inputTokens,
    outputTokens,
    cachedTokens,
    totalTokens: inputTokens + outputTokens,
    hasUsage,
    isEstimated: false
  };
}

/**
 * Creates a stream token accumulator with line buffering for Server-Sent Events (SSE).
 * Correctly handles TCP packet fragmentation so SSE JSON lines spanning multiple chunks
 * are never dropped or discarded.
 */
export function createStreamUsageParser(format = 'anthropic') {
  let lineBuffer = '';
  let accumulatedInputTokens = 0;
  let accumulatedOutputTokens = 0;
  let accumulatedCachedTokens = 0;
  let hasUsage = false;

  return {
    pushChunk(chunk) {
      if (!chunk) return;
      const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      lineBuffer += str;

      const lines = lineBuffer.split('\n');
      // Keep the last incomplete segment in the buffer
      lineBuffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payloadStr = line.replace(/^data:\s*/, '').trim();
        if (!payloadStr || payloadStr === '[DONE]') continue;

        try {
          const payload = JSON.parse(payloadStr);

          if (format === 'anthropic') {
            // Anthropic message_start event has message.usage.input_tokens
            if (payload.type === 'message_start' && payload.message?.usage) {
              const u = payload.message.usage;
              if (typeof u.input_tokens === 'number') {
                accumulatedInputTokens = Math.max(0, Math.floor(u.input_tokens));
                hasUsage = true;
              }
              if (typeof u.cache_read_input_tokens === 'number') {
                accumulatedCachedTokens = Math.max(0, Math.floor(u.cache_read_input_tokens));
              }
            }
            // Anthropic message_delta event has usage.output_tokens
            if (payload.type === 'message_delta' && payload.usage) {
              const u = payload.usage;
              if (typeof u.output_tokens === 'number') {
                accumulatedOutputTokens = Math.max(0, Math.floor(u.output_tokens));
                hasUsage = true;
              }
            }
          } else if (format === 'openai') {
            // OpenAI stream_options: { include_usage: true } emits a final chunk with usage
            if (payload.usage && typeof payload.usage === 'object') {
              const u = payload.usage;
              if (typeof u.prompt_tokens === 'number') {
                accumulatedInputTokens = Math.max(0, Math.floor(u.prompt_tokens));
                hasUsage = true;
              }
              if (typeof u.completion_tokens === 'number') {
                accumulatedOutputTokens = Math.max(0, Math.floor(u.completion_tokens));
                hasUsage = true;
              }
            }
          }
        } catch {
          // Incomplete or non-JSON SSE payload; safely skip
        }
      }
    },

    getUsage() {
      // Process remaining buffer if it contains complete JSON
      if (lineBuffer.trim().startsWith('data:')) {
        const payloadStr = lineBuffer.replace(/^data:\s*/, '').trim();
        if (payloadStr && payloadStr !== '[DONE]') {
          try {
            const payload = JSON.parse(payloadStr);
            if (payload.usage?.output_tokens) {
              accumulatedOutputTokens = Math.max(0, Math.floor(payload.usage.output_tokens));
              hasUsage = true;
            }
          } catch {}
        }
      }

      return {
        inputTokens: accumulatedInputTokens,
        outputTokens: accumulatedOutputTokens,
        cachedTokens: accumulatedCachedTokens,
        totalTokens: accumulatedInputTokens + accumulatedOutputTokens,
        hasUsage,
        isEstimated: false
      };
    }
  };
}

/**
 * Robustly parses a token count or quota number from any number or formatted string.
 * Handles commas ("4,280,500"), unit suffixes ("8.42M", "500k"), and numeric strings.
 */
export function parseTokenValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const clean = val.trim().replace(/,/g, '');
    if (!clean) return null;
    if (/^[\d.]+[mM]$/.test(clean)) {
      const num = parseFloat(clean);
      return Number.isFinite(num) ? Math.round(num * 1000000) : null;
    }
    if (/^[\d.]+[kK]$/.test(clean)) {
      const num = parseFloat(clean);
      return Number.isFinite(num) ? Math.round(num * 1000) : null;
    }
    const num = Number(clean);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Extracts rolling window token usage from any source object across all known aliases.
 */
export function extractWindowTokensUsed(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.windowTokensUsed,
    source.window_tokens_used,
    source.tokensUsed,
    source.used_tokens,
    source.usedTokens,
    source.tokens_used,
    source.key?.windowTokensUsed,
    source.key?.window_tokens_used,
    source.key?.tokensUsed,
    source.key?.used_tokens,
    source.key?.usedTokens,
    source.key?.tokens_used,
    source.data?.windowTokensUsed,
    source.data?.window_tokens_used,
    source.data?.tokensUsed,
    source.data?.used_tokens
  ];
  for (const c of candidates) {
    const parsed = parseTokenValue(c);
    if (parsed !== null && parsed >= 0) return parsed;
  }
  return null;
}

/**
 * Extracts percentage of quota consumed across all known aliases.
 */
export function extractUsagePercent(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.usagePercent,
    source.usage_percent,
    source.percentUsed,
    source.percent_used,
    source.key?.usagePercent,
    source.key?.usage_percent,
    source.key?.percentUsed,
    source.key?.percent_used,
    source.data?.usagePercent,
    source.data?.percentUsed
  ];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const clean = c.trim().replace(/%/g, '');
      const num = Number(clean);
      if (Number.isFinite(num) && num >= 0) return num;
    } else if (typeof c === 'number' && Number.isFinite(c) && c >= 0) {
      return c;
    }
  }
  return null;
}

/**
 * Extracts rolling window quota limit across all known aliases.
 */
export function extractWindowTokensLimit(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.windowTokensLimit,
    source.window_token_limit,
    source.tokenLimit,
    source.token_limit,
    source.quotaLimit,
    source.quota_limit,
    source.limit,
    source.key?.windowTokensLimit,
    source.key?.window_token_limit,
    source.key?.tokenLimit,
    source.key?.token_limit,
    source.key?.quotaLimit,
    source.key?.quota_limit,
    source.data?.windowTokensLimit,
    source.data?.window_token_limit
  ];
  for (const c of candidates) {
    const parsed = parseTokenValue(c);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Extracts lifetime total tokens consumed across all known aliases.
 */
export function extractTotalTokens(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.total_tokens_consumed,
    source.totalTokensConsumed,
    source.totalTokens,
    source.total_tokens,
    source.totalTokensUsed,
    source.tokensTotal,
    source.totalCount,
    source.total_count,
    source.tokenCount,
    source.token_count,
    source.consumed_tokens,
    source.consumedTokens,
    source.key?.total_tokens_consumed,
    source.key?.totalTokensConsumed,
    source.key?.totalTokens,
    source.key?.total_tokens,
    source.key?.totalTokensUsed,
    source.key?.tokensTotal,
    source.key?.totalCount,
    source.key?.total_count,
    source.key?.tokenCount,
    source.key?.token_count,
    source.data?.totalTokens,
    source.data?.total_tokens_consumed,
    source.data?.total_tokens
  ];
  for (const c of candidates) {
    const parsed = parseTokenValue(c);
    if (parsed !== null && parsed >= 0) return parsed;
  }
  return null;
}

/**
 * Extracts total request count across all known aliases.
 */
export function extractTotalRequests(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.totalRequests,
    source.total_requests,
    source.requests,
    source.total_requests_count,
    source.totalRequestsCount,
    source.key?.totalRequests,
    source.key?.total_requests,
    source.data?.totalRequests,
    source.data?.total_requests
  ];
  for (const c of candidates) {
    const parsed = parseTokenValue(c);
    if (parsed !== null && parsed >= 0) return parsed;
  }
  return null;
}

/**
 * Calculate true sliding 5-hour rolling window usage from database logs.
 * 
 * Formula:
 * window_start = current_time - 5 hours
 * eligible_records = usage_logs where created_at >= window_start and status_code < 400
 * used_tokens = sum(input_tokens + output_tokens)
 * remaining_tokens = max(0, quota_limit - used_tokens)
 * usage_percentage = (used_tokens / quota_limit) * 100
 * remaining_percentage = (remaining_tokens / quota_limit) * 100
 */
export async function calculateSlidingWindowUsage(keyRecord, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DURATION_MS);
  let windowStartIso = windowStart.toISOString();

  let rawTier = keyRecord?.tier;
  if (!rawTier && keyRecord?.key_token) {
    if (keyRecord.key_token.includes('20x')) rawTier = '20x';
    else if (keyRecord.key_token.includes('5x')) rawTier = '5x';
  }
  const tier = normalizeTier(rawTier);
  const tierConfig = quotaFor(tier);

  // Authoritative Quota Limit & Verification
  // The intended authoritative quota is 20,000,000 for Max 20x and 5,000,000 for Max 5x.
  // Legacy / stale database or cache values (e.g. 25M / 2.5M for 5x, or 100M / 200M for 20x) must not override.
  let quotaLimit = tierConfig.limit;
  let quotaSource = 'configured_tier';
  let isQuotaVerified = false;

  const upstreamLimit = extractWindowTokensLimit(options.upstreamData);
  if (typeof upstreamLimit === 'number' && upstreamLimit > 0) {
    if (!isLegacyStaleOverride(tier, upstreamLimit)) {
      quotaLimit = upstreamLimit;
      quotaSource = 'provider';
      isQuotaVerified = true;
    }
  } else if (
    typeof keyRecord?.window_token_limit === 'number' &&
    keyRecord.window_token_limit > 0 &&
    !isLegacyStaleOverride(tier, keyRecord.window_token_limit)
  ) {
    quotaLimit = keyRecord.window_token_limit;
    quotaSource = 'database';
    isQuotaVerified = true;
  }

  let usedTokens = 0;
  let totalRequestsInWindow = 0;
  let oldestLogInWindow = null;
  let hasLocalLogs = false;
  let checkedLocalLogs = false;
  const byModel = {};
  let usageSource = 'unavailable';
  let isUsageVerified = false;
  if (keyRecord?.id) {
    try {
      // Query usage_logs for records within the 5-hour sliding window
      const { data: logs, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('key_id', keyRecord.id)
        .gte('created_at', windowStartIso)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(logs)) {
        checkedLocalLogs = true;
        if (logs.length > 0) {
          for (const log of logs) {
            // Only count successful/billable requests (< 400 status code)
            if (typeof log.status_code === 'number' && log.status_code >= 400) {
              continue;
            }

            const inp = Number(log.input_tokens) || 0;
            const out = Number(log.output_tokens) || 0;
            const reqTokens = inp + out;
            usedTokens += reqTokens;
            totalRequestsInWindow++;
            hasLocalLogs = true;

            if (!oldestLogInWindow && log.created_at) {
              oldestLogInWindow = new Date(log.created_at);
            }

            // Aggregate per-model breakdown
            const modelName = log.model || 'claude-sonnet-4-6';
            if (!byModel[modelName]) {
              byModel[modelName] = {
                tokens: 0,
                input_tokens: 0,
                output_tokens: 0,
                requests: 0,
                percent: 0
              };
            }
            byModel[modelName].tokens += reqTokens;
            byModel[modelName].input_tokens += inp;
            byModel[modelName].output_tokens += out;
            byModel[modelName].requests++;
          }
        } else {
          // Check if there are older logs for this key (>5 hours ago)
          const { data: anyLogs } = await supabase.from('usage_logs').select('id').eq('key_id', keyRecord.id).limit(1);
          if (Array.isArray(anyLogs) && anyLogs.length > 0) {
            // Key has local logs, but all have rolled off (>5 hours ago) -> active window usage is 0!
            hasLocalLogs = true;
            usedTokens = 0;
            usageSource = 'local_gateway';
            isUsageVerified = true;
          }
        }
      }
    } catch (err) {
      console.warn(`[QuotaEngine] Warning querying usage_logs for key ${keyRecord.id}:`, err.message);
    }
  }

  // Determine usage source & verified state
  if (hasLocalLogs && !isUsageVerified) {
    usageSource = 'local_gateway';
    isUsageVerified = true;
  }

  // Cross-reference with authoritative upstream provider telemetry if available
  if (options.upstreamData) {
    const upTokens = extractWindowTokensUsed(options.upstreamData);
    const upPercent = extractUsagePercent(options.upstreamData);
    if (typeof upTokens === 'number') {
      if (!hasLocalLogs || upTokens > usedTokens) {
        usedTokens = upTokens;
        usageSource = 'provider_tokens';
        isUsageVerified = true;
      }
    } else if (typeof upPercent === 'number') {
      // Upstream provider explicitly provides usage percentage over active window
      const providerCalculatedTokens = Math.round((upPercent / 100) * quotaLimit);
      if (!hasLocalLogs || providerCalculatedTokens > usedTokens) {
        usedTokens = providerCalculatedTokens;
        usageSource = 'provider_percent';
        isUsageVerified = true;
      }
    }
  }

  // Fallback to database stored usage if no local window logs and no upstream telemetry
  const isWindowExpired = keyRecord?.window_resets_at && new Date(keyRecord.window_resets_at).getTime() <= now.getTime();
  const upstreamRequests = extractTotalRequests(options.upstreamData);
  const upPercent = extractUsagePercent(options.upstreamData);
  const upTokens = extractWindowTokensUsed(options.upstreamData);

  if (!isUsageVerified) {
    if (!isWindowExpired && typeof keyRecord?.window_tokens_used === 'number' && keyRecord.window_tokens_used > 0) {
      usedTokens = keyRecord.window_tokens_used;
      usageSource = 'database';
      isUsageVerified = true;
    } else if (
      (keyRecord?.total_requests === 0 || keyRecord?.total_requests === undefined) &&
      (!options.upstreamData || (upstreamRequests === 0 || upstreamRequests === null))
    ) {
      // Confirmed fresh/unused key
      usedTokens = 0;
      usageSource = 'new_key';
      isUsageVerified = true;
    } else if (options.upstreamData && upstreamRequests > 0 && upPercent === null && upTokens === null) {
      // Active upstream key with requests, but no token telemetry returned
      usedTokens = null;
      usageSource = 'unavailable';
      isUsageVerified = false;
    }
  }

  // Quota mathematical invariant calculations:
  // remaining_tokens = max(0, quota_limit - used_tokens)
  // When used_tokens <= quota_limit: used_tokens + remaining_tokens === quota_limit
  const remainingTokens = (usedTokens !== null) ? Math.max(0, quotaLimit - usedTokens) : null;
  const overQuotaTokens = (usedTokens !== null) ? Math.max(0, usedTokens - quotaLimit) : 0;
  const isOverQuota = (usedTokens !== null) ? usedTokens > quotaLimit : false;

  // Percentage calculations formatted to 1 decimal place
  let usagePercentage = null;
  let remainingPercentage = null;
  if (usedTokens !== null) {
    if (usageSource === 'provider_percent' && typeof upPercent === 'number') {
      usagePercentage = Math.min(100, upPercent);
      remainingPercentage = Math.max(0, Number((100 - usagePercentage).toFixed(1)));
    } else {
      const rawPct = Number(((usedTokens / quotaLimit) * 100).toFixed(1));
      usagePercentage = Math.min(100, rawPct);
      remainingPercentage = Math.max(0, Number(((remainingTokens / quotaLimit) * 100).toFixed(1)));
    }
  }

  // Populate model breakdown from upstream if local logs are empty
  if (Object.keys(byModel).length === 0 && options.upstreamData?.byModel) {
    for (const [modelKey, info] of Object.entries(options.upstreamData.byModel)) {
      const pct = typeof info?.percent === 'number' ? info.percent : 0;
      const modelTokens = usedTokens !== null ? Math.round((pct / 100) * (usedTokens || quotaLimit)) : 0;
      byModel[modelKey] = {
        tokens: modelTokens,
        input_tokens: 0,
        output_tokens: 0,
        requests: 0,
        percent: pct
      };
    }
  } else {
    for (const modelKey of Object.keys(byModel)) {
      const item = byModel[modelKey];
      item.percent = (usedTokens && usedTokens > 0) ? Number(((item.tokens / usedTokens) * 100).toFixed(1)) : 0;
    }
  }

  // Upstream authoritative timestamps take priority if available
  if (options.upstreamData?.windowStartedAt) {
    windowStartIso = new Date(options.upstreamData.windowStartedAt).toISOString();
  }

  const nextResetDate = options.upstreamData?.windowResetAt
    ? new Date(options.upstreamData.windowResetAt)
    : (oldestLogInWindow
        ? new Date(oldestLogInWindow.getTime() + WINDOW_DURATION_MS)
        : new Date(now.getTime() + WINDOW_DURATION_MS));

  const msRemaining = Math.max(0, nextResetDate.getTime() - now.getTime());
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsMod = Math.floor((msRemaining % (1000 * 60)) / 1000);
  const secondsRemaining = Math.floor(msRemaining / 1000);
  const timeRemainingFormatted = `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsMod).padStart(2, '0')}`;

  return {
    window_started_at: windowStartIso,
    window_resets_at: nextResetDate.toISOString(),
    quota_limit: quotaLimit,
    quota_source: quotaSource,
    is_quota_verified: isQuotaVerified,
    used_tokens: usedTokens,
    remaining_tokens: remainingTokens,
    over_quota_tokens: overQuotaTokens,
    is_over_quota: isOverQuota,
    usage_percentage: usagePercentage,
    remaining_percentage: remainingPercentage,
    usage_source: usageSource,
    is_usage_verified: isUsageVerified,
    byModel,
    total_requests_in_window: totalRequestsInWindow,
    seconds_remaining: secondsRemaining,
    time_remaining_formatted: timeRemainingFormatted,
    rate_limit_rpm: options.upstreamData?.rateLimit || keyRecord?.rate_limit_rpm || tierConfig.rpm,
    rate_limit_tpm: keyRecord?.rate_limit_tpm || tierConfig.tpm
  };
}

/**
 * Atomically record request usage and update key statistics
 */
export async function recordRequestUsage({
  keyRecord,
  model,
  inputTokens = 0,
  outputTokens = 0,
  cachedTokens = 0,
  latencyMs = 0,
  statusCode = 200,
  endpoint = '/v1/messages',
  requestId = null,
  clientIp = null
}) {
  if (!keyRecord) return null;

  // Strict numeric validation (0-safe)
  const inp = typeof inputTokens === 'number' && Number.isFinite(inputTokens) ? Math.max(0, Math.floor(inputTokens)) : 0;
  const out = typeof outputTokens === 'number' && Number.isFinite(outputTokens) ? Math.max(0, Math.floor(outputTokens)) : 0;
  const cached = typeof cachedTokens === 'number' && Number.isFinite(cachedTokens) ? Math.max(0, Math.floor(cachedTokens)) : 0;
  const totalTokens = inp + out;

  // Idempotency check: don't double count if same request ID is re-submitted
  if (requestId && isRequestRecorded(requestId)) {
    return { duplicate: true, totalTokens };
  }

  const unlock = await acquireKeyLock(keyRecord.id || keyRecord.key_token);
  try {
    const nowIso = new Date().toISOString();

    // 1. Insert detailed usage log record
    const { data: logData, error: logError } = await supabase.from('usage_logs').insert({
      key_id: keyRecord.id,
      model,
      input_tokens: inp,
      output_tokens: out,
      cached_tokens: cached,
      latency_ms: latencyMs,
      status_code: statusCode,
      endpoint,
      client_ip: clientIp,
      created_at: nowIso
    });

    if (requestId) {
      markRequestRecorded(requestId, totalTokens);
    }

    // 2. Compute updated rolling 5-hour window metrics
    const rollingUsage = await calculateSlidingWindowUsage(keyRecord);

    // 3. Atomically update key totals
    const newTotalTokens = (Number(keyRecord.total_tokens_consumed) || 0) + totalTokens;
    const newTotalRequests = (Number(keyRecord.total_requests) || 0) + 1;

    keyRecord.window_tokens_used = rollingUsage.used_tokens;
    keyRecord.total_tokens_consumed = newTotalTokens;
    keyRecord.total_requests = newTotalRequests;
    keyRecord.window_started_at = rollingUsage.window_started_at;
    keyRecord.window_resets_at = rollingUsage.window_resets_at;

    if (keyRecord.id) {
      await supabase.from('api_keys').update({
        window_tokens_used: rollingUsage.used_tokens,
        total_tokens_consumed: newTotalTokens,
        total_requests: newTotalRequests,
        window_started_at: rollingUsage.window_started_at,
        window_resets_at: rollingUsage.window_resets_at
      }).eq('id', keyRecord.id);
    }

    return {
      success: true,
      log: logData,
      rollingUsage
    };
  } finally {
    unlock();
  }
}
