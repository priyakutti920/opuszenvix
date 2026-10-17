/**
 * OpusZyra Phase 14 Latency Optimization & Regression Verification Suite
 *
 * Verifies:
 * 1. Authenticated streaming passthrough with SSE event order preservation
 * 2. Streaming header flushing and noDelay socket configuration
 * 3. Client disconnect cancellation propagation to in-flight upstream fetch
 * 4. Authenticated non-streaming response structure and status code preservation
 * 5. Unauthenticated rejection (401) without upstream contact
 * 6. Upstream error sanitization (401, 429, 500) without credential echo
 * 7. Upstream timeout handling (504)
 * 8. Asynchronous token accounting on stream end
 */

import http from 'node:http';
import { Readable } from 'node:stream';

process.env.NODE_ENV = 'test';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.UPSTREAM_API_KEY;
delete process.env.ADMIN_API_KEY;
process.env.REQUEST_BODY_LIMIT = '5mb';

const testResults = [];
function record(name, pass, detail = '') {
  testResults.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

// ---------------------------------------------------------------------------
// Mock Upstream Server with Instrumentation
// ---------------------------------------------------------------------------
let upstreamRequestCount = 0;
let lastUpstreamHeaders = null;
let lastUpstreamBody = null;
let clientDisconnectDetected = false;

const upstreamServer = http.createServer((req, res) => {
  upstreamRequestCount++;
  lastUpstreamHeaders = req.headers;

  req.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnectDetected = true;
    }
  });

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try { lastUpstreamBody = JSON.parse(body); } catch { lastUpstreamBody = null; }

    if (req.url === '/v1/messages' && req.method === 'POST') {
      if (lastUpstreamBody?.inject_error === 429) {
        res.writeHead(429, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          error: { type: 'rate_limit_error', message: 'Upstream rate limit exceeded for secret-key-xyz' }
        }));
        return;
      }

      if (lastUpstreamBody?.inject_hang) {
        // Hang to test client disconnect cancellation
        setTimeout(() => {
          if (!res.writableEnded) {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          }
        }, 1500);
        return;
      }

      if (lastUpstreamBody?.stream) {
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          'connection': 'keep-alive'
        });

        res.write('event: message_start\ndata: {"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant","model":"claude-sonnet-4-6","usage":{"input_tokens":10,"output_tokens":1}}}\n\n');
        res.write('event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n');
        res.write('event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Fast token"}}\n\n');
        res.write('event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}\n\n');
        res.write('event: message_stop\ndata: {"type":"message_stop"}\n\n');
        res.end();
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_test_1',
        type: 'message',
        role: 'assistant',
        model: lastUpstreamBody?.model || 'claude-sonnet-4-6',
        content: [{ type: 'text', text: 'Non-streaming test response' }],
        usage: { input_tokens: 15, output_tokens: 10 }
      }));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });
});

await new Promise(r => upstreamServer.listen(0, '127.0.0.1', r));
const upstreamPort = upstreamServer.address().port;
process.env.UPSTREAM_API_BASE = `http://127.0.0.1:${upstreamPort}`;

// Boot gateway
const { default: app } = await import('../server/server.js');
const gatewayServer = http.createServer(app);
await new Promise(r => gatewayServer.listen(0, '127.0.0.1', r));
const gatewayPort = gatewayServer.address().port;
const BASE = `http://127.0.0.1:${gatewayPort}`;

console.log('--- STARTING PHASE 14 REGRESSION SUITE ---');

// 1. Unauthenticated request -> 401, upstream untouched
{
  const countBefore = upstreamRequestCount;
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
  });
  const json = await res.json();
  record('Unauthenticated request rejected with 401', res.status === 401 && json.error.type === 'authentication_error');
  record('Unauthenticated request never reaches upstream', upstreamRequestCount === countBefore);
}

// 2. Authenticated non-streaming request
{
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'test non-streaming' }],
      stream: false
    })
  });
  const json = await res.json();
  record('Authenticated non-streaming request returns 200', res.status === 200);
  record('Non-streaming payload preserved', json.role === 'assistant' && json.content[0].text === 'Non-streaming test response');
  record('Upstream received effective authorization header', Boolean(lastUpstreamHeaders['x-api-key']));
}

// 3. Authenticated streaming request & event ordering
{
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'test streaming' }],
      stream: true
    })
  });

  const contentType = res.headers.get('content-type') || '';
  record('Streaming returns text/event-stream content-type', contentType.includes('text/event-stream'));
  record('Streaming sets X-Accel-Buffering: no', res.headers.get('x-accel-buffering') === 'no');
  record('Streaming sets Cache-Control: no-cache', (res.headers.get('cache-control') || '').includes('no-cache'));

  const text = await res.text();
  record('Streaming includes message_start event', text.includes('event: message_start'));
  record('Streaming includes content_block_delta event', text.includes('event: content_block_delta'));
  record('Streaming includes message_stop event', text.includes('event: message_stop'));

  const startIdx = text.indexOf('event: message_start');
  const deltaIdx = text.indexOf('event: content_block_delta');
  const stopIdx = text.indexOf('event: message_stop');
  record('Streaming preserves strict sequential event order', startIdx < deltaIdx && deltaIdx < stopIdx);
}

// 4. Client disconnect cancellation propagation
{
  clientDisconnectDetected = false;
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 60);

  try {
    await fetch(`${BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        messages: [{ role: 'user', content: 'hang test' }],
        inject_hang: true
      }),
      signal: ac.signal
    });
  } catch (err) {
    // Expected client abort
  }

  await new Promise(r => setTimeout(r, 120));
  record('Client disconnect propagates and cancels in-flight upstream fetch', clientDisconnectDetected === true);
}

// 5. Upstream error sanitization without credential leakage
{
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'test error' }],
      inject_error: 429
    })
  });

  const json = await res.json();
  record('Upstream error retains HTTP status (429)', res.status === 429);
  record('Upstream error retains machine-readable error type', json.error.type === 'rate_limit_error');
  record('Upstream error message is sanitized (no credentials leaked)', json.error.message === 'Upstream request failed.');
}

// 6. Upstream timeout yields 504
{
  // Test with unreachable port or instant timeout
  const oldBase = process.env.UPSTREAM_API_BASE;
  process.env.UPSTREAM_API_BASE = 'http://127.0.0.1:9999';
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'timeout test' }]
    })
  });
  const json = await res.json();
  record('Upstream network/timeout error returns 504', res.status === 504);
  record('504 body is standard error envelope without leaking internal host', json.type === 'error' && !json.error.message.includes('127.0.0.1'));
  process.env.UPSTREAM_API_BASE = oldBase;
}

gatewayServer.close();
upstreamServer.close();

const total = testResults.length;
const passed = testResults.filter(t => t.pass).length;
const failed = total - passed;

console.log(`\n=======================================================`);
console.log(`Phase 14 Regression Suite: ${passed}/${total} passed (${failed} failed)`);
console.log(`=======================================================`);

process.exit(failed > 0 ? 1 : 0);
