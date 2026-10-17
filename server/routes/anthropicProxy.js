import express from 'express';
import { Readable } from 'stream';
import { supabase } from '../lib/supabase.js';
import { upstreamTimeoutSignal, isTimeoutError } from '../lib/security.js';

const router = express.Router();

const getUpstreamBase = () => (process.env.UPSTREAM_API_BASE || 'https://api.opuszen.shop').replace(/\/+$/, '');
const getMasterUpstreamKey = () => (process.env.UPSTREAM_API_KEY || '').trim();

// Response budget for the completion call. A slow upstream otherwise pins the
// request handler — and a serverless function slot — for the whole budget.
const getUpstreamTimeoutMs = () => Number(process.env.UPSTREAM_TIMEOUT_MS) || 60_000;

// A retry here would risk double-billing a paid completion or double-counting
// streamed output, so all upstream calls are single-attempt.
const upstreamRequest = (url, init) =>
  fetch(url, { ...init, signal: upstreamTimeoutSignal(getUpstreamTimeoutMs()) });

// Upstream error bodies are forwarded verbatim today, which can echo the
// master key back to the caller: an upstream auth failure often repeats the
// credential it rejected, and we sent UPSTREAM_API_KEY with the request.
// Keep the status code and the machine-readable error type (so clients can
// still branch on authentication_error vs rate_limit_error) but drop the body
// text entirely.
const forwardSafeUpstreamError = async (res, upstreamRes) => {
  const contentType = upstreamRes.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const parsed = await upstreamRes.json();
      const inner = parsed && typeof parsed === 'object' ? parsed.error : null;
      const type = inner && typeof inner.type === 'string' ? inner.type : 'api_error';
      return res.status(upstreamRes.status).json({
        type: 'error',
        error: { type, message: 'Upstream request failed.' }
      });
    } catch {
      // Unparseable body, fall through to the generic branch below.
    }
  }
  await upstreamRes.text().catch(() => '');
  return res.status(upstreamRes.status).json({
    type: 'error',
    error: { type: 'api_error', message: 'Upstream request failed.' }
  });
};

// `messages` must be a non-empty array of role/content entries; a bare string
// or array of garbage otherwise produces a guaranteed upstream error charge.
const isValidMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  return messages.every(
    (m) => m && typeof m === 'object' && typeof m.role === 'string' && ('content' in m)
  );
};

// Helper to extract API key from headers or query
export const extractApiKey = (req) => {
  const xApiKey = req.headers['x-api-key'];
  if (xApiKey && typeof xApiKey === 'string' && xApiKey.trim()) return xApiKey.trim();

  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (req.query && req.query.key) return String(req.query.key).trim();
  if (req.body && req.body.key) return String(req.body.key).trim();
  if (req.body && req.body.key_token) return String(req.body.key_token).trim();

  return null;
};

// 1. Discovery / Health status endpoint (GET /v1/messages or GET /messages)
router.get('/messages', (req, res) => {
  const upstreamBase = getUpstreamBase();
  const apiDomain = process.env.API_DOMAIN || 'https://api.opuszyra.live';

  return res.json({
    status: 'ok',
    service: 'Opuszyra Middle-Man AI Gateway',
    version: '1.0.0',
    upstream: upstreamBase,
    gateway_domain: apiDomain,
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/v1/chat/completions',
      messages: '/v1/messages',
      models: '/v1/models',
      keyStatus: '/api/key-status',
      status: '/api/status'
    }
  });
});

// 2. Models listing endpoint (GET /v1/models)
router.get('/models', async (req, res) => {
  const upstreamBase = getUpstreamBase();
  const masterKey = getMasterUpstreamKey();
  const clientKey = extractApiKey(req);
  const activeKey = masterKey || clientKey;

  try {
    // Tighter budget here: the model list has a local fallback, so waiting
    // 60s for a slow upstream would only make the SPA's spinner hang.
    const upstreamRes = await fetch(`${upstreamBase}/v1/models`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(activeKey ? { 'x-api-key': activeKey, 'Authorization': `Bearer ${activeKey}` } : {})
      },
      signal: AbortSignal.timeout(10_000)
    });

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn(`Upstream /v1/models fetch failed, returning standard models:`, err.message);
  }

  // Fallback models catalog if upstream is offline
  return res.json({
    data: [
      { id: 'claude-fable-5-1', display_name: 'Claude Fable 5.1', created_at: '2026-09-01T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5', created_at: '2026-09-22T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', created_at: '2026-06-10T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-opus-4-8', display_name: 'Claude Opus 4.8', created_at: '2026-05-28T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-opus-4-7', display_name: 'Claude Opus 4.7', created_at: '2026-04-16T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6', created_at: '2026-02-17T00:00:00Z', type: 'model', context_window: 1000000 },
      { id: 'claude-3-7-sonnet-20250219', display_name: 'Claude 3.7 Sonnet', created_at: '2025-02-19T00:00:00Z', type: 'model', context_window: 200000 },
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet v2', created_at: '2024-10-22T00:00:00Z', type: 'model', context_window: 200000 },
      { id: 'claude-3-5-haiku-20241022', display_name: 'Claude 3.5 Haiku', created_at: '2024-10-22T00:00:00Z', type: 'model', context_window: 200000 },
      { id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus', created_at: '2024-02-29T00:00:00Z', type: 'model', context_window: 200000 }
    ],
    has_more: false,
    first_id: 'claude-fable-5-1',
    last_id: 'claude-3-opus-20240229'
  });
});

// 3. Passthrough Anthropic Messages API (POST /v1/messages)
router.post('/messages', async (req, res) => {
  const startTime = Date.now();
  const upstreamBase = getUpstreamBase();
  const masterKey = getMasterUpstreamKey();
  const clientKey = extractApiKey(req);

  // Require client key to ensure callers authenticate
  if (!clientKey) {
    return res.status(401).json({
      type: 'error',
      error: {
        type: 'authentication_error',
        message: 'Missing API key. Provide Authorization: Bearer <key> or x-api-key header.'
      }
    });
  }

  // Determine effective key: master upstream key takes precedence if configured, otherwise client's key
  const effectiveUpstreamKey = masterKey || clientKey;

  // Local Supabase validation if key is tracked in database
  let keyRecord = null;
  if (clientKey) {
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_token', clientKey)
        .maybeSingle();

      if (data) {
        keyRecord = data;

        if (keyRecord.status !== 'active') {
          return res.status(403).json({
            type: 'error',
            error: {
              type: 'permission_error',
              message: `API Key is currently ${keyRecord.status}`
            }
          });
        }

        // Check 5-hour rolling window
        const now = new Date();
        if (now >= new Date(keyRecord.window_resets_at)) {
          keyRecord.window_tokens_used = 0;
          keyRecord.window_started_at = now.toISOString();
          keyRecord.window_resets_at = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
        }

        if (keyRecord.window_tokens_used >= keyRecord.window_token_limit) {
          const minutesRemaining = Math.max(1, Math.round((new Date(keyRecord.window_resets_at).getTime() - now.getTime()) / 60000));
          return res.status(429).json({
            type: 'error',
            error: {
              type: 'rate_limit_error',
              message: `5-hour window capacity exceeded (${keyRecord.window_tokens_used}/${keyRecord.window_token_limit} tokens). Resets in ${minutesRemaining} minutes.`
            }
          });
        }
      }
    } catch (e) {
      // Supabase offline, proceed with passthrough
    }
  }

  const { model = 'claude-3-7-sonnet-20250219', stream = false } = req.body;

  if (!isValidMessages(req.body.messages)) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: 'messages must be a non-empty array of { role, content } objects.'
      }
    });
  }

  // Prepare upstream request headers
  const forwardHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': effectiveUpstreamKey,
    'Authorization': `Bearer ${effectiveUpstreamKey}`,
    'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
  };

  if (req.headers['anthropic-beta']) {
    forwardHeaders['anthropic-beta'] = req.headers['anthropic-beta'];
  }

  try {
    // Forward directly to Upstream AI Gateway (https://api.opuszen.shop)
    const upstreamRes = await upstreamRequest(`${upstreamBase}/v1/messages`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(req.body)
    });

    // If upstream returns an error, forward with the same status code but a
    // sanitised body, so an upstream response cannot carry the master key
    // back to the client.
    if (!upstreamRes.ok) {
      return await forwardSafeUpstreamError(res, upstreamRes);
    }

    // STREAMING PASSTHROUGH (Server-Sent Events)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      if (upstreamRes.body) {
        const nodeStream = Readable.fromWeb(upstreamRes.body);

        let accumulatedOutputTokens = 0;
        let accumulatedInputTokens = 0;

        nodeStream.on('data', (chunk) => {
          res.write(chunk);
          // Non-blocking parse of token usage from SSE lines
          try {
            const chunkStr = chunk.toString();
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line.includes('usage')) {
                const data = JSON.parse(line.slice(6));
                if (data.message?.usage?.input_tokens) accumulatedInputTokens = data.message.usage.input_tokens;
                if (data.usage?.output_tokens) accumulatedOutputTokens = data.usage.output_tokens;
              }
            }
          } catch {
            // ignore
          }
        });

        let streamCompleted = false;

        nodeStream.on('end', () => {
          streamCompleted = true;
          res.end();
          if (keyRecord && (accumulatedInputTokens > 0 || accumulatedOutputTokens > 0)) {
            updateTokensAndLog(keyRecord, model, accumulatedInputTokens, accumulatedOutputTokens, 0, Date.now() - startTime).catch(() => {});
          }
        });

        nodeStream.on('error', (err) => {
          // Log without the raw cause: fetch surfaces rejected promises as the
          // error object, and reading .message from those is what leaks paths.
          console.error('Streaming passthrough error:', err?.name || 'StreamError', '-', err?.message || '');
          if (!res.headersSent) {
            return res.status(502).json({
              type: 'error',
              error: { type: 'api_error', message: 'Upstream stream failed.' }
            });
          }
          res.end();
        });

        req.on('close', () => {
          if (!streamCompleted) {
            nodeStream.destroy();
          }
        });

        return;
      }
    }

    // NON-STREAMING PASSTHROUGH
    const data = await upstreamRes.json();
    const inputTokens = data?.usage?.input_tokens || 50;
    const outputTokens = data?.usage?.output_tokens || 100;
    const cachedTokens = data?.usage?.cache_read_input_tokens || 0;

    if (keyRecord) {
      updateTokensAndLog(keyRecord, model, inputTokens, outputTokens, cachedTokens, Date.now() - startTime).catch(() => {});
    }

    return res.status(upstreamRes.status).json(data);

  } catch (err) {
    // Only report a timeout if the response had not started: once headers are
    // sent the client has disconnected, and that is not an upstream failure.
    const timedOut = isTimeoutError(err) && !res.headersSent;
    console.error('Upstream passthrough network failure:', err?.name || 'Error', '-', err?.message || '');

    if (res.headersSent) return res.end();
    return res.status(504).json({
      type: 'error',
      error: {
        type: 'api_error',
        message: timedOut
          ? 'Upstream request timed out. Please retry.'
          : 'Upstream connection error. Please retry.'
      }
    });
  }
});

// 4. OpenAI format passthrough (/v1/chat/completions)
router.post('/chat/completions', async (req, res) => {
  const upstreamBase = getUpstreamBase();
  const masterKey = getMasterUpstreamKey();
  const clientKey = extractApiKey(req);

  if (!clientKey) {
    return res.status(401).json({ error: { message: 'Missing Authorization header or API key' } });
  }

  const effectiveKey = masterKey || clientKey;

  const { stream = false } = req.body;

  try {
    const upstreamRes = await upstreamRequest(`${upstreamBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveKey}`,
        'x-api-key': effectiveKey
      },
      body: JSON.stringify(req.body)
    });

    if (!upstreamRes.ok) {
      return await forwardSafeUpstreamError(res, upstreamRes);
    }

    if (stream && upstreamRes.body) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const nodeStream = Readable.fromWeb(upstreamRes.body);
      nodeStream.on('error', (err) => {
        console.error('Streaming passthrough error:', err?.name || 'StreamError', '-', err?.message || '');
        if (res.writableEnded) return;
        if (!res.headersSent) {
          return res.status(502).json({
            error: { type: 'api_error', message: 'Upstream stream failed.' }
          });
        }
        res.end();
      });
      nodeStream.pipe(res);
      return;
    }

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    const timedOut = isTimeoutError(err) && !res.headersSent;
    console.error('Upstream passthrough network failure:', err?.name || 'Error', '-', err?.message || '');

    if (res.headersSent) return res.end();
    return res.status(504).json({
      error: {
        type: 'api_error',
        message: timedOut
          ? 'Upstream request timed out. Please retry.'
          : 'Upstream connection error. Please retry.'
      }
    });
  }
});

async function updateTokensAndLog(keyRecord, model, inputTokens, outputTokens, cachedTokens, latencyMs) {
  try {
    const totalReqTokens = inputTokens + outputTokens;
    const newUsed = Number(keyRecord.window_tokens_used || 0) + totalReqTokens;
    const newTotal = Number(keyRecord.total_tokens_consumed || 0) + totalReqTokens;
    const newRequests = Number(keyRecord.total_requests || 0) + 1;

    keyRecord.window_tokens_used = newUsed;
    keyRecord.total_tokens_consumed = newTotal;
    keyRecord.total_requests = newRequests;

    await supabase.from('api_keys').update({
      window_tokens_used: newUsed,
      total_tokens_consumed: newTotal,
      total_requests: newRequests,
      window_started_at: keyRecord.window_started_at,
      window_resets_at: keyRecord.window_resets_at
    }).eq('id', keyRecord.id);

    await supabase.from('usage_logs').insert({
      key_id: keyRecord.id,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cached_tokens: cachedTokens,
      latency_ms: latencyMs,
      status_code: 200,
      endpoint: '/v1/messages'
    });
  } catch {
    // Silent fail if log fails
  }
}

export default router;
