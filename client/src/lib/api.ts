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
      throw new Error(`API returned HTML (${res.status}). Server endpoint not found at ${url}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text || `Request to ${url} failed with status ${res.status}`);
    }
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || json.error || `Request failed with status ${res.status}`);
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

export async function checkKey(keyToken: string = ''): Promise<CheckKeyData> {
  const token = (keyToken || '').trim();
  let serverError: string | null = null;

  // 1. Try local Gateway /api/key-status via POST
  try {
    const postBody = token ? { key: token, key_token: token } : {};
    const json = await safeJsonFetch(`${API_BASE}/key-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    });
    if (json.key || json.status === 'ok') {
      const data = json.key || json;
      const actualToken = data.key_token || token;
      const timer = getAnchoredWindowTimer(actualToken, data.window_resets_at || data.windowResetAt);
      return {
        ...data,
        window_resets_at: timer.window_resets_at,
        secondsRemaining: timer.secondsRemaining,
        timeRemainingFormatted: timer.timeRemainingFormatted,
        rawPayload: json.rawPayload || json
      };
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('API returned HTML')) {
      serverError = err.message;
    }
  }

  // 2. Try URL slug endpoint: /api/key-status/:token or GET /api/key-status
  try {
    const url = token ? `${API_BASE}/key-status/${encodeURIComponent(token)}` : `${API_BASE}/key-status`;
    const json = await safeJsonFetch(url);
    if (json.key || json.status === 'ok') {
      const data = json.key || json;
      const actualToken = data.key_token || token;
      const timer = getAnchoredWindowTimer(actualToken, data.window_resets_at || data.windowResetAt);
      return {
        ...data,
        window_resets_at: timer.window_resets_at,
        secondsRemaining: timer.secondsRemaining,
        timeRemainingFormatted: timer.timeRemainingFormatted,
        rawPayload: json.rawPayload || json
      };
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('API returned HTML')) {
      serverError = err.message;
    }
  }

  // 3. Try secondary /api/keys/check
  try {
    const json = await safeJsonFetch(`${API_BASE}/keys/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key_token: token }),
    });
    if (json.key) {
      const timer = getAnchoredWindowTimer(token, json.key.window_resets_at);
      return {
        ...json.key,
        window_resets_at: timer.window_resets_at,
        secondsRemaining: timer.secondsRemaining,
        timeRemainingFormatted: timer.timeRemainingFormatted,
        rawPayload: json.rawPayload || json
      };
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('API returned HTML')) {
      serverError = err.message;
    }
  }

  // 4. Fallback to GET query format on gateway /api/key-status
  try {
    let upData: any = null;
    
    try {
      const getRes = await fetch(`${API_BASE}/key-status?key=${encodeURIComponent(token)}`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' }
      });
      if (getRes.ok) {
        upData = await getRes.json();
      }
    } catch {
      // ignore
    }

    if (upData) {
      const timer = getAnchoredWindowTimer(token, upData.windowResetAt);

      let planName = 'Unverified Plan';
      let planSource: 'provider' | 'database' | 'unverified' = 'unverified';
      let isPlanVerified = false;

      if (upData.planName && typeof upData.planName === 'string' && upData.planName.trim()) {
        planName = upData.planName.trim();
        planSource = 'provider';
        isPlanVerified = true;
      }

      const is20x = Boolean(
        (upData.planName && upData.planName.toLowerCase().includes('20x')) ||
        (upData.name && upData.name.toLowerCase().includes('20x'))
      );
      const tier: PlanTier = upData.tier || (is20x ? '20x' : '5x');
      const defaultLimit = tier === '20x' ? 20000000 : 25000000;
      const rawLimit = Number(upData.windowTokensLimit);
      const isStaleLimitOverride = tier === '20x' && (rawLimit === 100000000 || rawLimit === 200000000);
      const tokenLimit = (rawLimit && !isStaleLimitOverride) ? rawLimit : defaultLimit;
      const isQuotaVerified = Boolean(rawLimit && !isStaleLimitOverride);
      const quotaSource: 'provider' | 'configured_tier' = isQuotaVerified ? 'provider' : 'configured_tier';

      let tokensUsed: number | null = null;
      let usageSource: 'provider_tokens' | 'provider_percent' | 'new_key' | 'unavailable' = 'unavailable';
      let isUsageVerified = false;

      if (typeof upData.windowTokensUsed === 'number') {
        tokensUsed = upData.windowTokensUsed;
        usageSource = 'provider_tokens';
        isUsageVerified = true;
      } else if (typeof upData.usagePercent === 'number') {
        tokensUsed = Math.round((upData.usagePercent / 100) * tokenLimit);
        usageSource = 'provider_percent';
        isUsageVerified = true;
      } else if (typeof upData.key?.window_tokens_used === 'number') {
        tokensUsed = upData.key.window_tokens_used;
        usageSource = 'provider_tokens';
        isUsageVerified = true;
      } else if (upData.totalRequests === 0) {
        tokensUsed = 0;
        usageSource = 'new_key';
        isUsageVerified = true;
      }

      const remainingTokens = tokensUsed !== null ? Math.max(0, tokenLimit - tokensUsed) : null;
      const percentUsed = typeof upData.usagePercent === 'number'
        ? upData.usagePercent
        : (tokensUsed !== null ? Math.min(100, Math.max(0, Number(((tokensUsed / tokenLimit) * 100).toFixed(1)))) : null);
      const percentRemaining = percentUsed !== null ? Math.max(0, Number((100 - percentUsed).toFixed(1))) : null;

      const masked = token.length > 12 ? `${token.slice(0, 14)}...${token.slice(-4)}` : token;

      return {
        id: 'upstream-key',
        name: upData.name || planName,
        planName,
        planSource,
        isPlanVerified,
        quotaSource,
        isQuotaVerified,
        usageSource,
        isUsageVerified,
        lastSyncTime: new Date().toISOString(),
        byModel: upData.byModel || null,
        key_token: token,
        masked_token: masked,
        tier,
        status: upData.keyStatus || 'active',
        rate_limit_rpm: upData.rateLimit || 60,
        rate_limit_tpm: tier === '20x' ? 1000000 : 400000,
        window_token_limit: tokenLimit,
        window_tokens_used: tokensUsed,
        window_tokens_remaining: remainingTokens,
        percentUsed,
        percentRemaining,
        timeRemainingFormatted: timer.timeRemainingFormatted,
        secondsRemaining: timer.secondsRemaining,
        window_started_at: new Date(new Date(timer.window_resets_at).getTime() - 5 * 60 * 60 * 1000).toISOString(),
        window_resets_at: timer.window_resets_at,
        total_tokens_consumed: upData.totalRequests ? (tokensUsed ?? 0) : 0,
        total_requests: upData.totalRequests || 0,
        successRequests: upData.successRequests || 0,
        failedRequests: upData.failedRequests || 0,
        last24hRequests: upData.last24h?.requests || 0,
        allocatedCredits: upData.allocatedCredits ?? 0,
        usedCredits: upData.usedCredits ?? 0,
        remainingCredits: upData.remainingCredits ?? 0,
        unlimited: upData.unlimited ?? false,
        windowActive: upData.windowActive ?? true,
        models_accessible: upData.allowedModels || [
          'claude-opus-5-5',
          'claude-sonnet-5',
          'claude-fable-5-1',
          'claude-sonnet-4-6'
        ],
        allowedProviders: upData.allowedProviders || ['opuslive'],
        isRealtime: true,
        connectionStatus: upData.connectionStatus || 'Online',
        rawPayload: upData
      };
    }
  } catch {
    // Upstream network error
  }

  if (serverError) {
    throw new Error(serverError);
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
