import { ApiKey, CheckKeyData, SystemStats, UsageLog, PlanTier, ModelInfo } from '../types';

const API_BASE = '/api';

export async function fetchOverviewStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) throw new Error('Failed to load system stats');
  const json = await res.json();
  return json.stats;
}

export async function fetchGatewayStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to load gateway status');
  return await res.json();
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch('/v1/models');
    if (!res.ok) throw new Error('Failed to load models');
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchKeys(): Promise<ApiKey[]> {
  const res = await fetch(`${API_BASE}/keys`);
  if (!res.ok) throw new Error('Failed to load API keys');
  const json = await res.json();
  return json.keys || [];
}

export async function generateKey(name: string, tier: PlanTier): Promise<ApiKey> {
  const res = await fetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tier }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to generate key');
  return json.key;
}

export async function checkKey(keyToken: string): Promise<CheckKeyData> {
  // Query /api/key-status which validates with upstream https://api.opuszen.shop in real-time
  const res = await fetch(`${API_BASE}/key-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyToken.trim(), key_token: keyToken.trim() }),
  });
  
  const json = await res.json();
  if (!res.ok) {
    // Fallback to /api/keys/check if /api/key-status had an issue
    const fallbackRes = await fetch(`${API_BASE}/keys/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key_token: keyToken.trim() }),
    });
    const fallbackJson = await fallbackRes.json();
    if (!fallbackRes.ok) throw new Error(fallbackJson.error || json.error || 'Key inspection failed');
    return fallbackJson.key;
  }
  
  return json.key;
}

export async function deleteKey(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete key');
}

export async function resetKeyWindow(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/keys/${id}/reset-window`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reset window');
}

export async function fetchLogs(): Promise<UsageLog[]> {
  const res = await fetch(`${API_BASE}/stats/logs`);
  if (!res.ok) throw new Error('Failed to load logs');
  const json = await res.json();
  return json.logs || [];
}

export async function createCryptoOrder(tier: PlanTier) {
  const res = await fetch(`${API_BASE}/stats/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to initialize order');
  return json.order;
}

export async function verifyCryptoOrder(orderId: string, tier: PlanTier, txHash: string) {
  const res = await fetch(`${API_BASE}/stats/orders/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, tier, txHash }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Payment verification failed');
  return json;
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
