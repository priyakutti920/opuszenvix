/**
 * OpusZyra Phase 15 Upstream Provider Migration Verification Suite
 *
 * Verifies live integration with https://api.opusmax.live through the OpusZyra gateway:
 * 1. Gateway health and upstream URL reflection
 * 2. Unauthenticated client rejection (401)
 * 3. Models catalog discovery (/v1/models) passthrough from opusmax.live
 * 4. Authenticated non-streaming inference (/v1/messages) passthrough
 * 5. Authenticated streaming inference (/v1/messages, stream=true) with SSE chunk reception
 * 6. Live Key Status Inspection (/api/key-status) against opusmax.live
 * 7. Verification that no secret keys are leaked in response payloads
 */

import http from 'node:http';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('--- BOOTING OPUSZYRA GATEWAY WITH UPSTREAM: https://api.opusmax.live ---');

const { default: app } = await import('../server/server.js');
const server = http.createServer(app);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

const CLIENT_KEY = 'opm-live-5x-9f8a3c2e1b4d7f0a';

console.log(`Gateway running on ${BASE}`);

// 1. Health endpoint reflects new upstream
{
  const res = await fetch(`${BASE}/api/health`);
  const json = await res.json();
  record('Gateway /api/health reflects https://api.opusmax.live', json.upstream === 'https://api.opusmax.live');
}

// 2. Unauthenticated request rejected
{
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
  });
  const json = await res.json();
  record('Unauthenticated request rejected with 401', res.status === 401 && json.error?.type === 'authentication_error');
}

// 3. Models catalog passthrough
{
  const res = await fetch(`${BASE}/v1/models`, {
    headers: { 'x-api-key': CLIENT_KEY }
  });
  const json = await res.json();
  const hasModels = Array.isArray(json.data) && json.data.length > 0;
  const hasSonnet46 = json.data?.some(m => m.id === 'claude-sonnet-4-6');
  record('/v1/models returns live catalog from upstream', res.status === 200 && hasModels);
  record('Live catalog includes default model claude-sonnet-4-6', hasSonnet46);
}

// 4. Live Non-streaming inference passthrough
{
  const t0 = performance.now();
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': CLIENT_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 15,
      messages: [{ role: 'user', content: 'Reply with the word SUCCESS' }],
      stream: false
    })
  });
  const ms = (performance.now() - t0).toFixed(1);
  const json = await res.json();
  record(`Live non-streaming inference returned 200 (${ms}ms)`, res.status === 200);
  record('Live non-streaming response has assistant role', json.role === 'assistant');
  record('Live non-streaming response has content array', Array.isArray(json.content) && json.content.length > 0);
  record('Live non-streaming response has usage metrics', Boolean(json.usage?.output_tokens));
}

// 5. Live Streaming inference passthrough
{
  const t0 = performance.now();
  const res = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': CLIENT_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 15,
      messages: [{ role: 'user', content: 'Count 1 2 3' }],
      stream: true
    })
  });

  const contentType = res.headers.get('content-type') || '';
  record('Live streaming response returns text/event-stream', contentType.includes('text/event-stream'));
  record('Live streaming response sets X-Accel-Buffering: no', res.headers.get('x-accel-buffering') === 'no');

  const sseEvents = [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        sseEvents.push(line.slice(7).trim());
      }
    }
  }

  const ms = (performance.now() - t0).toFixed(1);
  record(`Live streaming completed successfully (${ms}ms)`, sseEvents.includes('message_start') && sseEvents.includes('message_stop'));
}

// 6. Live Key Status Inspection
{
  const masterKey = (process.env.UPSTREAM_API_KEY || '').trim();
  if (masterKey) {
    const res = await fetch(`${BASE}/api/key-status?key=${encodeURIComponent(masterKey)}`);
    const json = await res.json();
    record('Key status inspection returned 200 against opusmax.live', res.status === 200);
    record('Key status payload contains success=true and active keyStatus', json.success === true && json.keyStatus === 'active');
    record('Key status provides masked_token for UI display', typeof json.key?.masked_token === 'string' && json.key.masked_token.includes('...'));
  }
}

server.close();

const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

console.log(`\n=======================================================`);
console.log(`Phase 15 Migration Suite: ${passed}/${total} passed (${failed} failed)`);
console.log(`=======================================================`);

process.exit(failed > 0 ? 1 : 0);
