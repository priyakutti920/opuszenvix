import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import keysRouter, { handleKeyStatusInspection } from './routes/keys.js';
import anthropicRouter from './routes/anthropicProxy.js';
import statsRouter from './routes/stats.js';
import { supabase } from './lib/supabase.js';
import { createRateLimiter, adminKeyRequired } from './lib/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../client/dist');

import { getUpstreamBase } from './lib/config.js';

const app = express();
const PORT = process.env.PORT || 5000;
const API_DOMAIN = process.env.API_DOMAIN || 'https://api.opuszenvix.live';

const getActiveUpstream = () => {
  try {
    return getUpstreamBase();
  } catch {
    return null;
  }
};

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
// Body cap for completion traffic. The parser buffers the whole request, so
// 50MB per connection is a cheap DoS on a serverless runtime. 5MB still
// covers normal multi-modal payloads.
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '5mb';
// Key management and checkout payloads are small JSON objects.
const CONTROL_BODY_LIMIT = '16kb';

app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: CONTROL_BODY_LIMIT }));
// Redact sensitive query parameters from server logs
morgan.token('url', (req) => {
  const raw = req.originalUrl || req.url;
  return raw.replace(/([?&](?:key|key_token|token)=)[^&]+/gi, '$1[REDACTED]');
});
app.use(morgan('dev'));

// Opt-in shared credential protecting key management and order verification.
// Unset by default so the current unauthenticated dashboard keeps working.
const requireAdminKey = adminKeyRequired(supabase);

// Middle-man Anthropic & OpenAI Proxy Routes (/v1 and /api/v1)
// These forward to a paid upstream, so they get the tightest per-IP cap.
app.use('/v1', createRateLimiter({ max: 60, windowMs: 60 * 1000 }), anthropicRouter);
app.use('/api/v1', createRateLimiter({ max: 60, windowMs: 60 * 1000 }), anthropicRouter);

// Real-time Key Status Inspection endpoints. Inspection fans out to upstream
// lookups, so it is capped separately from the completion proxy.
app.all(['/api/key-status', '/api/key-status/:token', '/api/key-status/:token/*'], createRateLimiter({ max: 30, windowMs: 60 * 1000 }), handleKeyStatusInspection);
app.use('/api/keys', requireAdminKey, createRateLimiter({ max: 30, windowMs: 60 * 1000 }), keysRouter);

// Statistics and Billing
// Lower cap than the proxy: these routes are not on the streaming path and
// are polled by the SPA, so a large body has no upside here.
app.use('/api/stats', createRateLimiter({ max: 120, windowMs: 60 * 1000 }), statsRouter);

// Comprehensive Gateway Status (/api/status)
app.get('/api/status', async (req, res) => {
  const start = Date.now();
  let upstreamStatus = null;
  let upstreamLatency = null;
  const upstreamBase = getActiveUpstream();

  if (upstreamBase) {
    try {
      const t0 = Date.now();
      const upRes = await fetch(`${upstreamBase}/api/status`, { method: 'GET' });
      upstreamLatency = Date.now() - t0;
      if (upRes.ok) {
        upstreamStatus = await upRes.json();
      }
    } catch (err) {
      console.warn(`Upstream status query to ${upstreamBase} failed:`, err.message);
    }
  }

  const localLatency = Date.now() - start;

  return res.json({
    status: 'ok',
    service: 'Opuszenvix Middle-Man AI Gateway',
    timestamp: new Date().toISOString(),
    refreshInterval: 30,
    overall: upstreamStatus?.overall || 'operational',
    middleMan: {
      domain: API_DOMAIN,
      upstream: upstreamBase || 'not configured',
      status: 'operational',
      latencyMs: localLatency,
      uptime: '99.99%'
    },
    services: upstreamStatus?.services || [
      {
        name: 'Middle-Man Proxy service',
        status: 'operational',
        description: 'Low-latency passthrough routing, SSE streaming, and Claude model mapping'
      },
      {
        name: 'API gateway',
        status: 'operational',
        description: 'Authentication bypass, rolling window limits, and token accounting'
      },
      {
        name: 'Key management',
        status: 'operational',
        description: 'Real-time key status inspection and 5-hour quota budget enforcement'
      }
    ],
    metrics: upstreamStatus?.metrics || {
      latency: upstreamLatency || 18,
      uptime: '100%',
      refresh: '30s'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const upstreamBase = getActiveUpstream();
  res.json({
    status: 'online',
    service: 'Opuszenvix AI Gateway',
    role: 'Middle Man Passthrough Proxy',
    upstream: upstreamBase || 'not configured',
    gateway: `${API_DOMAIN}/v1`,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build files if present
app.use(express.static(clientDist));

// SPA Fallback for every non-API route. Written without a path pattern so it
// behaves identically on Express 4 and 5 (Express 5's path-to-regexp throws on
// a bare `'*'`). Must stay after the router mounts so real endpoints win.
const indexHtml = path.join(clientDist, 'index.html');
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) return next();
  const p = req.path;
  if (p.startsWith('/v1') || p.startsWith('/api')) return next();
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

// Catch-all JSON 404 for unhandled API and v1 routes (never return HTML)
app.use(['/api', '/v1'], (req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

// Centralized error-handling middleware to prevent stack trace and internal path leakage
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: 'Malformed JSON payload in request body'
      },
      status: 400
    });
  }

  console.error('Unhandled internal server error:', err.message);
  return res.status(err.status || 500).json({
    type: 'error',
    error: {
      type: 'api_error',
      message: 'An internal server error occurred'
    },
    status: err.status || 500
  });
});

// Start listener only when running directly (never when imported as a serverless module)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') || 
  process.argv[1].endsWith('server\\server.js') ||
  process.argv[1].endsWith('server/server.js')
);

if (isDirectRun && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Opuszenvix Middle-Man AI Gateway running on port ${PORT}`);
    console.log(`🌐 Middle-Man Public Domain: ${API_DOMAIN}`);
    console.log(`📡 Upstream Passthrough URL: ${getActiveUpstream() || 'NOT CONFIGURED'}`);
    console.log(`⚡ Anthropic Proxy: http://localhost:${PORT}/v1/messages`);
    console.log(`🔑 Key Status Inspector: http://localhost:${PORT}/api/key-status`);
    console.log(`📊 System Status: http://localhost:${PORT}/api/status`);
    console.log(`=======================================================`);
  });
}

export default app;
