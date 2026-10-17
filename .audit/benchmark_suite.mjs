/**
 * OpusZyra Phase 14 Performance Benchmark Suite
 *
 * Measures:
 * - Gateway latency overhead
 * - Time To First Byte (TTFB)
 * - Time To First Token / First Content Chunk (TTFT)
 * - Total streaming completion time
 * - Non-streaming latency
 * - p50, p95, min, max, error rates
 *
 * Uses an isolated local mock upstream to ensure 100% reproducible,
 * deterministic measurements without confounding upstream network jitter or provider quota usage.
 */

import http from 'node:http';
import { Readable } from 'node:stream';

// Configure environment for isolated testing
process.env.NODE_ENV = 'test';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.UPSTREAM_API_KEY;
delete process.env.ADMIN_API_KEY;
process.env.REQUEST_BODY_LIMIT = '5mb';

// ---------------------------------------------------------------------------
// 1. Mock Upstream Server
// ---------------------------------------------------------------------------
// Simulates a realistic upstream LLM service:
// - Non-streaming: 40ms model inference delay, returns Anthropic message JSON
// - Streaming: 40ms prefill delay, then 5 SSE chunks emitted every 15ms
const upstreamServer = http.createServer((req, res) => {
  if (req.url === '/v1/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch {}

      if (parsed.stream) {
        // SSE Streaming response
        setTimeout(() => {
          res.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache',
            'connection': 'keep-alive'
          });

          const chunks = [
            'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant","model":"claude-sonnet-4-6","usage":{"input_tokens":25,"output_tokens":1}}}\n\n',
            'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n\n',
            'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":15}}\n\n',
            'event: message_stop\ndata: {"type":"message_stop"}\n\n'
          ];

          let idx = 0;
          const interval = setInterval(() => {
            if (idx < chunks.length) {
              res.write(chunks[idx]);
              idx++;
            } else {
              clearInterval(interval);
              res.end();
            }
          }, 15);
        }, 40); // 40ms prefill
      } else {
        // Non-streaming response
        setTimeout(() => {
          const resp = {
            id: 'msg_1',
            type: 'message',
            role: 'assistant',
            model: 'claude-sonnet-4-6',
            content: [{ type: 'text', text: 'Hello world' }],
            usage: { input_tokens: 25, output_tokens: 15 }
          };
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(resp));
        }, 40); // 40ms inference
      }
    });
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

await new Promise(r => upstreamServer.listen(0, '127.0.0.1', r));
const upstreamPort = upstreamServer.address().port;
const upstreamUrl = `http://127.0.0.1:${upstreamPort}`;
process.env.UPSTREAM_API_BASE = upstreamUrl;

// ---------------------------------------------------------------------------
// 2. Boot OpusZyra Gateway
// ---------------------------------------------------------------------------
const { default: app } = await import('../server/server.js');
const gatewayServer = http.createServer(app);
await new Promise(r => gatewayServer.listen(0, '127.0.0.1', r));
const gatewayPort = gatewayServer.address().port;
const gatewayUrl = `http://127.0.0.1:${gatewayPort}`;

// ---------------------------------------------------------------------------
// 3. Measurement Harness
// ---------------------------------------------------------------------------
async function measureNonStreaming(iterations = 25) {
  const ttfbList = [];
  const totalList = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(`${gatewayUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          messages: [{ role: 'user', content: 'test' }],
          stream: false
        })
      });

      const ttfb = performance.now() - t0;
      await res.json();
      const total = performance.now() - t0;

      if (!res.ok) errors++;
      ttfbList.push(ttfb);
      totalList.push(total);
    } catch {
      errors++;
    }
  }

  return { ttfbList, totalList, errors };
}

async function measureStreaming(iterations = 25) {
  const ttfbList = [];
  const ttftList = [];
  const totalList = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(`${gatewayUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'opm-live-5x-9f8a3c2e1b4d7f0a'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          messages: [{ role: 'user', content: 'test' }],
          stream: true
        })
      });

      const ttfb = performance.now() - t0;
      let ttft = null;

      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ttft === null && value && value.length > 0) {
          ttft = performance.now() - t0;
        }
      }
      const total = performance.now() - t0;

      if (!res.ok) errors++;
      ttfbList.push(ttfb);
      ttftList.push(ttft || total);
      totalList.push(total);
    } catch (err) {
      errors++;
    }
  }

  return { ttfbList, ttftList, totalList, errors };
}

function stats(arr) {
  if (!arr.length) return { median: 0, p95: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { median, p95, min, max };
}

console.log('--- WARMUP ---');
await measureNonStreaming(5);
await measureStreaming(5);

console.log('--- RUNNING BENCHMARK ---');
const nonStream = await measureNonStreaming(25);
const stream = await measureStreaming(25);

console.log('\n=== RESULTS ===');
console.log('Non-Streaming (iterations=25):');
console.log(`  TTFB: median=${stats(nonStream.ttfbList).median.toFixed(2)}ms, p95=${stats(nonStream.ttfbList).p95.toFixed(2)}ms, min=${stats(nonStream.ttfbList).min.toFixed(2)}ms, max=${stats(nonStream.ttfbList).max.toFixed(2)}ms`);
console.log(`  Total: median=${stats(nonStream.totalList).median.toFixed(2)}ms, p95=${stats(nonStream.totalList).p95.toFixed(2)}ms`);
console.log(`  Errors: ${nonStream.errors}`);

console.log('\nStreaming (iterations=25):');
console.log(`  TTFB: median=${stats(stream.ttfbList).median.toFixed(2)}ms, p95=${stats(stream.ttfbList).p95.toFixed(2)}ms, min=${stats(stream.ttfbList).min.toFixed(2)}ms, max=${stats(stream.ttfbList).max.toFixed(2)}ms`);
console.log(`  TTFT (First Token): median=${stats(stream.ttftList).median.toFixed(2)}ms, p95=${stats(stream.ttftList).p95.toFixed(2)}ms, min=${stats(stream.ttftList).min.toFixed(2)}ms, max=${stats(stream.ttftList).max.toFixed(2)}ms`);
console.log(`  Total Duration: median=${stats(stream.totalList).median.toFixed(2)}ms, p95=${stats(stream.totalList).p95.toFixed(2)}ms`);
console.log(`  Errors: ${stream.errors}`);

// Upstream nominal baseline:
// Non-streaming upstream baseline = 40.0ms
// Streaming upstream baseline = TTFB/TTFT=40ms+15ms=55ms, Total=40ms + 6*15ms = 130ms
const gatewayOverheadNonStreamMedian = stats(nonStream.totalList).median - 40;
const gatewayOverheadNonStreamP95 = stats(nonStream.totalList).p95 - 40;
console.log(`\nGateway Overhead (Non-Streaming): median=${gatewayOverheadNonStreamMedian.toFixed(2)}ms, p95=${gatewayOverheadNonStreamP95.toFixed(2)}ms`);

gatewayServer.close();
upstreamServer.close();
process.exit(0);
