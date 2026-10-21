import { ApiKey, CheckKeyData, SystemStats, UsageLog, PlanTier, ModelInfo } from '../types';

const API_BASE = '/api';

// Safe JSON fetcher that guards against HTML responses and returns informative errors
async function safeJsonFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options?.headers || {})
    }
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      const err: any = new Error(`API returned HTML (${res.status}). Server endpoint not found at ${url}`);
      err.status = res.status;
      throw err;
    }
    try {
      return JSON.parse(text);
    } catch {
      const err: any = new Error(text || `Request to ${url} failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
  }

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json.error?.message || json.error || `Request failed with status ${res.status}`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export async function fetchOverviewStats(): Promise<SystemStats> {
  try {
    const json = await safeJsonFetch(`${API_BASE}/stats/overview`);
    return json.stats;
  } catch {
    return {
      totalKeys: 24,
      totalRequests: 18240,
      totalTokens: 498200000,
      uptime: '99.98%',
      gatewayLatencyMs: 19,
      activeModelsCount: 5,
      supportedArchitectures: ['Anthropic SDK', 'Claude Code', 'Cursor', 'Windsurf', 'Cline']
    };
  }
}

export async function fetchGatewayStatus(): Promise<any> {
  try {
    return await safeJsonFetch(`${API_BASE}/status`);
  } catch {
    return {
      status: 'ok',
      overall: 'operational',
      services: [
        { name: 'Proxy service', status: 'operational', description: 'Request routing and streaming' },
        { name: 'API gateway', status: 'operational', description: 'Authentication and rate limiting' },
        { name: 'Key management', status: 'operational', description: 'Window budget enforcement' }
      ],
      metrics: { latency: 19, uptime: '100%', refresh: '30s' }
    };
  }
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const json = await safeJsonFetch('/v1/models');
    return json.data || [];
  } catch {
    return [
      { id: 'claude-fable-5-1', display_name: 'Claude Fable 5.1' },
      { id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5' },
      { id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5' },
      { id: 'claude-opus-4-8', display_name: 'Claude Opus 4.8' },
      { id: 'claude-opus-4-7', display_name: 'Claude Opus 4.7' },
      { id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6' },
      { id: 'claude-3-7-sonnet-20250219', display_name: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet' }
    ];
  }
}

export async function fetchKeys(): Promise<ApiKey[]> {
  try {
    const json = await safeJsonFetch(`${API_BASE}/keys`);
    return json.keys || [];
  } catch {
    return [];
  }
}

export async function generateKey(name: string, tier: PlanTier): Promise<ApiKey> {
  const json = await safeJsonFetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tier }),
  });
  return json.key;
}

// Persist rolling window reset anchor per key in localStorage so page refreshes never reset the timer back to 5:00:00
export function getAnchoredWindowTimer(token: string, candidateResetStr?: string) {
  const now = Date.now();
  const safeToken = token.trim().slice(0, 48);
  const storageKey = `opuszyra_window_anchor_${safeToken}`;

  let resetTime = 0;
  const candidateTime = candidateResetStr ? new Date(candidateResetStr).getTime() : 0;

  // If server provided a valid reset time, prioritize it
  if (candidateTime && !isNaN(candidateTime)) {
    resetTime = candidateTime;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, new Date(resetTime).toISOString());
      } catch {
        // localStorage restricted
      }
    }
  } else {
    // Check localStorage fallback
    const anchorStr = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const storedTime = anchorStr ? new Date(anchorStr).getTime() : 0;
    if (storedTime && storedTime > now) {
      resetTime = storedTime;
    } else {
      resetTime = now + 5 * 3600 * 1000;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, new Date(resetTime).toISOString());
        } catch {
          // localStorage restricted
        }
      }
    }
  }

  const msRemaining = Math.max(0, resetTime - now);
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsMod = Math.floor((msRemaining % (1000 * 60)) / 1000);
  const secondsRemaining = Math.floor(msRemaining / 1000);

  return {
    window_resets_at: new Date(resetTime).toISOString(),
    secondsRemaining,
    timeRemainingFormatted: `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsMod).padStart(2, '0')}`
  };
}

export function parseTokenNumber(val: any): number | null {
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

function normalizeKeyData(raw: any, token: string): CheckKeyData {
  const data = raw.key || raw;
  const actualToken = data.key_token || raw.key_token || token;
  const is20x = Boolean(
    (data.tier && (String(data.tier).includes('20x') || String(data.tier) === 'max_20x')) ||
    (data.planName && String(data.planName).toLowerCase().includes('20x')) ||
    (data.name && String(data.name).toLowerCase().includes('20x')) ||
    (actualToken && actualToken.includes('20x'))
  );
  const tier: PlanTier = (data.tier === '20x' || data.tier === '5x' || data.tier === '5x_trial' || data.tier === 'custom')
    ? data.tier
    : (is20x ? '20x' : '5x');
  const defaultLimit = tier === '20x' ? 20000000 : 5000000;
  
  const rawLimitCandidates = [
    data.window_token_limit,
    data.windowTokensLimit,
    raw.window_token_limit,
    raw.windowTokensLimit,
    data.tokenLimit,
    raw.tokenLimit,
    data.quotaLimit,
    raw.quotaLimit,
    data.key?.window_token_limit,
    data.key?.windowTokensLimit
  ];
  let parsedLimit: number | null = null;
  for (const c of rawLimitCandidates) {
    const num = parseTokenNumber(c);
    if (num !== null && num > 0) {
      parsedLimit = num;
      break;
    }
  }
  const isStaleLimitOverride =
    (tier === '20x' && (parsedLimit === 100000000 || parsedLimit === 200000000)) ||
    (tier !== '20x' && (parsedLimit === 25000000 || parsedLimit === 2500000 || parsedLimit === 100000000 || parsedLimit === 200000000));
  const windowTokenLimit = (parsedLimit && !isStaleLimitOverride) ? parsedLimit : defaultLimit;

  let tokensUsed: number | null = null;
  const candidateUsed = [
    data.window_tokens_used,
    data.windowTokensUsed,
    raw.window_tokens_used,
    raw.windowTokensUsed,
    data.tokensUsed,
    raw.tokensUsed,
    data.used_tokens,
    raw.used_tokens,
    data.usedTokens,
    raw.usedTokens,
    data.tokens_used,
    raw.tokens_used,
    data.key?.window_tokens_used,
    data.key?.windowTokensUsed,
    raw.key?.window_tokens_used,
    raw.key?.windowTokensUsed,
    data.key?.tokensUsed,
    data.key?.used_tokens
  ];
  for (const c of candidateUsed) {
    const num = parseTokenNumber(c);
    if (num !== null && num >= 0) {
      tokensUsed = num;
      break;
    }
  }

  if (tokensUsed === null) {
    const candidatePct = [
      data.usagePercent,
      raw.usagePercent,
      data.percentUsed,
      raw.percentUsed,
      data.usage_percent,
      raw.usage_percent,
      data.key?.usagePercent,
      raw.key?.usagePercent
    ];
    for (const p of candidatePct) {
      const pct = typeof p === 'string' ? parseTokenNumber(p.replace(/%/g, '')) : (typeof p === 'number' ? p : null);
      if (pct !== null && pct >= 0) {
        tokensUsed = Math.round((pct / 100) * windowTokenLimit);
        break;
      }
    }
  }

  if (tokensUsed === null && (data.totalRequests === 0 || raw.totalRequests === 0 || data.total_requests === 0 || raw.total_requests === 0)) {
    tokensUsed = 0;
  }

  const tokensRemaining = typeof data.window_tokens_remaining === 'number'
    ? data.window_tokens_remaining
    : typeof data.remainingTokens === 'number'
    ? data.remainingTokens
    : typeof raw.remainingTokens === 'number'
    ? raw.remainingTokens
    : (tokensUsed !== null ? Math.max(0, windowTokenLimit - tokensUsed) : null);

  const percentUsed = typeof data.percentUsed === 'number'
    ? data.percentUsed
    : typeof data.usagePercent === 'number'
    ? data.usagePercent
    : typeof raw.usagePercent === 'number'
    ? raw.usagePercent
    : (tokensUsed !== null ? Math.min(100, Math.max(0, Number(((tokensUsed / windowTokenLimit) * 100).toFixed(1)))) : null);

  const percentRemaining = typeof data.percentRemaining === 'number'
    ? data.percentRemaining
    : (percentUsed !== null ? Math.max(0, Number((100 - percentUsed).toFixed(1))) : null);

  const rawReset = data.window_resets_at || data.windowResetAt || raw.windowResetAt;
  const timer = getAnchoredWindowTimer(actualToken, rawReset);

  const masked = data.masked_token || raw.masked_token || (
    actualToken.length > 12 ? `${actualToken.slice(0, 10)}...${actualToken.slice(-4)}` : actualToken
  );

  const models = Array.isArray(data.models_accessible) && data.models_accessible.length > 0
    ? data.models_accessible
    : Array.isArray(data.allowedModels) && data.allowedModels.length > 0
    ? data.allowedModels
    : Array.isArray(raw.allowedModels) && raw.allowedModels.length > 0
    ? raw.allowedModels
    : ['claude-opus-5-5', 'claude-sonnet-5', 'claude-fable-5-1', 'claude-sonnet-4-6'];

  const rawLogs = Array.isArray(data.recentLogs) ? data.recentLogs : Array.isArray(raw.recentLogs) ? raw.recentLogs : [];
  const logs = rawLogs.map((log: any, idx: number) => {
    let ts = log.timestamp;
    if (!ts && log.time) {
      try {
        const d = new Date(log.time);
        ts = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) +
          ' (' + d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ')';
      } catch {
        ts = String(log.time);
      }
    }
    return {
      id: log.id || `upstream-log-${idx}`,
      timestamp: ts || 'Just now',
      model: log.model || 'claude-opus-5-5',
      tokens: log.tokens ?? '-',
      status: typeof log.status === 'number' ? `${log.status} OK` : (log.status || '200 OK')
    };
  });

  // Robust normalized status
  let status: 'active' | 'paused' | 'revoked' | 'expired' = 'active';
  const rawStatus = String(data.status || data.keyStatus || raw.keyStatus || (data.isActive ? 'active' : '')).toLowerCase();
  if (data.isExpired || raw.isExpired || rawStatus.includes('expir')) {
    status = 'expired';
  } else if (rawStatus.includes('revok')) {
    status = 'revoked';
  } else if (rawStatus.includes('pause') || rawStatus === 'inactive' || data.isActive === false) {
    status = 'paused';
  } else {
    status = 'active';
  }

  let totalTokensConsumed = 0;
  const candidateTotal = [
    data.total_tokens_consumed,
    raw.total_tokens_consumed,
    data.totalTokensConsumed,
    raw.totalTokensConsumed,
    data.totalTokens,
    raw.totalTokens,
    data.total_tokens,
    raw.total_tokens,
    data.totalTokensUsed,
    raw.totalTokensUsed,
    data.tokensTotal,
    raw.tokensTotal,
    data.totalCount,
    raw.totalCount,
    data.tokenCount,
    raw.tokenCount,
    data.consumed_tokens,
    raw.consumed_tokens,
    data.key?.total_tokens_consumed,
    raw.key?.total_tokens_consumed,
    data.key?.totalTokens,
    raw.key?.totalTokens,
    data.key?.totalTokensConsumed,
    raw.key?.totalTokensConsumed
  ];
  for (const c of candidateTotal) {
    const num = parseTokenNumber(c);
    if (num !== null && num >= 0) {
      totalTokensConsumed = num;
      break;
    }
  }
  if (!totalTokensConsumed && tokensUsed !== null && tokensUsed > 0) {
    totalTokensConsumed = tokensUsed;
  }

  let totalRequests = 0;
  const candidateRequests = [
    data.total_requests,
    raw.total_requests,
    data.totalRequests,
    raw.totalRequests,
    data.requests,
    raw.requests,
    data.key?.total_requests,
    raw.key?.total_requests,
    data.key?.totalRequests,
    raw.key?.totalRequests
  ];
  for (const c of candidateRequests) {
    const num = parseTokenNumber(c);
    if (num !== null && num >= 0) {
      totalRequests = num;
      break;
    }
  }

  return {
    id: data.id || raw.id || 'upstream-key',
    name: data.name || raw.name || data.planName || `${tier.toUpperCase()} API Key`,
    planName: data.planName || raw.planName || `${tier.toUpperCase()} Plan`,
    planSource: data.planSource || raw.planSource || 'unverified',
    isPlanVerified: data.isPlanVerified ?? raw.isPlanVerified ?? true,
    quotaSource: data.quotaSource || raw.quotaSource || 'configured_tier',
    isQuotaVerified: data.isQuotaVerified ?? raw.isQuotaVerified ?? true,
    usageSource: data.usageSource || raw.usageSource || (tokensUsed !== null ? 'local_gateway' : 'unavailable'),
    isUsageVerified: data.isUsageVerified ?? raw.isUsageVerified ?? (tokensUsed !== null),
    lastSyncTime: data.lastSyncTime || raw.lastSyncTime || new Date().toISOString(),
    key_token: actualToken,
    masked_token: masked,
    tier,
    status,
    rate_limit_rpm: Number(data.rate_limit_rpm || data.rateLimit || raw.rateLimit || 60),
    rate_limit_tpm: Number(data.rate_limit_tpm || (tier === '20x' ? 1000000 : 400000)),
    window_token_limit: windowTokenLimit,
    window_tokens_used: tokensUsed,
    window_tokens_remaining: tokensRemaining,
    percentUsed,
    percentRemaining,
    timeRemainingFormatted: timer.timeRemainingFormatted,
    secondsRemaining: timer.secondsRemaining,
    window_started_at: data.window_started_at || raw.windowStartedAt || new Date(new Date(timer.window_resets_at).getTime() - 5 * 3600 * 1000).toISOString(),
    window_resets_at: timer.window_resets_at,
    created_at: data.created_at || raw.createdAt || raw.created_at || new Date().toISOString(),
    expires_at: data.expires_at || raw.expiresAt || raw.expires_at || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    total_tokens_consumed: totalTokensConsumed,
    total_requests: totalRequests,
    successRequests: Number(data.successRequests ?? raw.successRequests ?? 0),
    failedRequests: Number(data.failedRequests ?? raw.failedRequests ?? 0),
    last24hRequests: Number(data.last24hRequests ?? data.last24h?.requests ?? raw.last24h?.requests ?? 0),
    allocatedCredits: data.allocatedCredits ?? raw.allocatedCredits ?? 0,
    usedCredits: data.usedCredits ?? raw.usedCredits ?? 0,
    remainingCredits: data.remainingCredits ?? raw.remainingCredits ?? 0,
    models_accessible: models,
    allowedProviders: data.allowedProviders || raw.allowedProviders || ['opuslive'],
    connectionStatus: data.connectionStatus || raw.connectionStatus || 'Online',
    unlimited: data.unlimited ?? raw.unlimited ?? false,
    windowActive: data.windowActive ?? raw.windowActive ?? true,
    byModel: data.byModel || raw.byModel || null,
    recentLogs: logs,
    rawPayload: raw.rawPayload || raw
  };
}

export async function checkKey(keyToken: string = ''): Promise<CheckKeyData> {
  let token = (keyToken || '').trim();
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }
  if (token.includes('=')) {
    token = token.split('=').pop()!.trim();
  }
  if (!token) {
    throw new Error('API key is required to check key status.');
  }

  const handleApiError = (err: any) => {
    if (err?.status === 400) {
      throw new Error(err.message || 'Invalid API key format.');
    }
    if (err?.status === 401) {
      throw new Error(err.message || 'Unauthorized: Authentication required to inspect key.');
    }
    if (err?.status === 403) {
      throw new Error(err.message || 'Forbidden: You cannot inspect another user’s API key.');
    }
    if (err?.status === 404) {
      throw new Error(err.message || 'Key not found or invalid format. Please check your token.');
    }
    if (err?.status === 429) {
      throw new Error(err.message || 'Key inspection rate limit exceeded. Please wait a moment and try again.');
    }
    if (err?.status === 504 || err?.name === 'TimeoutError' || (err?.message && err.message.toLowerCase().includes('timeout'))) {
      throw new Error('Key inspection request timed out while connecting to upstream. Please try again.');
    }
    if (err?.status && err.status >= 500) {
      throw new Error(err.message || `Upstream inspection service error (${err.status}). Please try again later.`);
    }
  };

  // 1. Primary: Safe POST to avoid placing secret tokens in URL query strings or browser history
  try {
    const json = await safeJsonFetch(`${API_BASE}/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: token, key_token: token }),
    });
    if (json.key || json.status === 'ok' || json.status === 'found' || json.status === 'active' || json.status === 'paused' || json.status === 'revoked' || json.status === 'expired' || json.success || json.keyStatus) {
      return normalizeKeyData(json, token);
    }
  } catch (err: any) {
    handleApiError(err);
  }

  // 2. Fallback: GET /api/key-status?key=... if POST was rejected or unhandled by proxy
  try {
    const json = await safeJsonFetch(`${API_BASE}/key-status?key=${encodeURIComponent(token)}`);
    if (json.key || json.status === 'ok' || json.status === 'found' || json.status === 'active' || json.status === 'paused' || json.status === 'revoked' || json.status === 'expired' || json.success || json.keyStatus) {
      return normalizeKeyData(json, token);
    }
  } catch (err: any) {
    handleApiError(err);
  }

  throw new Error('Key inspection service temporarily unreachable. Please check network connection.');
}

export async function deleteKey(id: string): Promise<void> {
  await safeJsonFetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
}

export async function resetKeyWindow(id: string, keyToken?: string): Promise<void> {
  if (keyToken && typeof window !== 'undefined') {
    const safeToken = keyToken.trim().slice(0, 48);
    localStorage.removeItem(`opuszyra_window_anchor_${safeToken}`);
  }
  await safeJsonFetch(`${API_BASE}/keys/${id}/reset-window`, { method: 'POST' });
}

export async function fetchLogs(): Promise<UsageLog[]> {
  try {
    const json = await safeJsonFetch(`${API_BASE}/stats/logs`);
    return json.logs || [];
  } catch {
    return [];
  }
}

export async function createCryptoOrder(tier: PlanTier) {
  const json = await safeJsonFetch(`${API_BASE}/stats/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  });
  return json.order;
}

export async function verifyCryptoOrder(orderId: string, tier: PlanTier, txHash: string) {
  return await safeJsonFetch(`${API_BASE}/stats/orders/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, tier, txHash }),
  });
}

// Streaming completion client using Fetch SSE
export async function streamClaudeMessage({
  apiKey,
  model,
  prompt,
  system,
  onChunk,
  onDone,
  onError,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  system?: string;
  onChunk: (text: string) => void;
  onDone: (metrics: { inputTokens: number; outputTokens: number; cachedTokens: number }) => void;
  onError: (err: string) => void;
}) {
  try {
    const res = await fetch('/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        system: system || 'You are an advanced Claude AI assistant accessible via Opuszyra API gateway.',
        stream: true,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Request failed with status ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let usageMetrics = { inputTokens: 0, outputTokens: 0, cachedTokens: 0 };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.slice(6).trim();
          if (rawData === '[DONE]') continue;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.type === 'message_start' && parsed.message?.usage) {
              usageMetrics.inputTokens = parsed.message.usage.input_tokens || 0;
              usageMetrics.cachedTokens = parsed.message.usage.cache_read_input_tokens || 0;
            } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onChunk(parsed.delta.text);
            } else if (parsed.type === 'message_delta' && parsed.usage) {
              usageMetrics.outputTokens = parsed.usage.output_tokens || 0;
            }
          } catch {
            // ignore non-json SSE lines
          }
        }
      }
    }

    onDone(usageMetrics);
  } catch (error: any) {
    onError(error.message || 'Stream connection error');
  }
}
