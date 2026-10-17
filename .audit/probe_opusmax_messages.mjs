/**
 * Controlled test of /v1/messages on https://api.opusmax.live
 * Tests non-streaming, streaming, model list, and error handling.
 */

import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const TARGET_BASE = 'https://api.opusmax.live';
const KEY = (process.env.UPSTREAM_API_KEY || '').trim();

async function runTests() {
  // 1. Fetch full model catalog
  console.log('=== 1. MODEL CATALOG ===');
  const modRes = await fetch(`${TARGET_BASE}/v1/models`, {
    headers: { 'x-api-key': KEY, 'Accept': 'application/json' }
  });
  const modData = await modRes.json();
  const modelIds = modData.data?.map(m => m.id) || [];
  console.log('Total models:', modelIds.length);
  console.log('Model IDs sample:', modelIds.slice(0, 15));

  // Check if default models exist
  console.log('claude-sonnet-4-6 in models?', modelIds.includes('claude-sonnet-4-6'));
  console.log('claude-3-7-sonnet-20250219 in models?', modelIds.includes('claude-3-7-sonnet-20250219'));
  console.log('claude-3-5-sonnet-20241022 in models?', modelIds.includes('claude-3-5-sonnet-20241022'));

  // 2. Non-streaming test
  console.log('\n=== 2. NON-STREAMING TEST ===');
  const testModel = modelIds.includes('claude-sonnet-4-6') ? 'claude-sonnet-4-6' : (modelIds[0] || 'claude-3-7-sonnet-20250219');
  console.log('Testing model:', testModel);

  const t0 = performance.now();
  const nonStreamRes = await fetch(`${TARGET_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: testModel,
      max_tokens: 15,
      messages: [{ role: 'user', content: 'Say hi in 1 word' }],
      stream: false
    })
  });

  const nonStreamMs = (performance.now() - t0).toFixed(1);
  console.log('Non-streaming HTTP status:', nonStreamRes.status, `(${nonStreamMs}ms)`);
  const nonStreamData = await nonStreamRes.json();
  console.log('Response type:', nonStreamData.type, 'role:', nonStreamData.role, 'model:', nonStreamData.model);
  console.log('Response content:', JSON.stringify(nonStreamData.content));
  console.log('Response usage:', JSON.stringify(nonStreamData.usage));

  // 3. Streaming test
  console.log('\n=== 3. STREAMING TEST ===');
  const tStream0 = performance.now();
  const streamRes = await fetch(`${TARGET_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: testModel,
      max_tokens: 15,
      messages: [{ role: 'user', content: 'Say hello in 1 word' }],
      stream: true
    })
  });

  console.log('Streaming HTTP status:', streamRes.status);
  console.log('Streaming content-type:', streamRes.headers.get('content-type'));

  const streamEvents = [];
  const reader = streamRes.body.getReader();
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
        streamEvents.push(line.slice(7).trim());
      }
    }
  }

  const streamMs = (performance.now() - tStream0).toFixed(1);
  console.log(`Stream complete in ${streamMs}ms`);
  console.log('Received SSE events:', streamEvents);

  // 4. Invalid auth test
  console.log('\n=== 4. INVALID AUTH TEST ===');
  const badAuthRes = await fetch(`${TARGET_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'bad-invalid-key-xyz',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: testModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }]
    })
  });
  console.log('Bad auth status:', badAuthRes.status);
  console.log('Bad auth body:', await badAuthRes.text());
}

runTests().catch(e => console.error('Error:', e));
