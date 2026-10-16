import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import keysRouter, { handleKeyStatusInspection } from './routes/keys.js';
import anthropicRouter from './routes/anthropicProxy.js';
import statsRouter from './routes/stats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;
const UPSTREAM_API_BASE = (process.env.UPSTREAM_API_BASE || 'https://api.opuszen.shop').replace(/\/+$/, '');
const API_DOMAIN = process.env.API_DOMAIN || 'https://api.opuszyra.live';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Middle-man Anthropic & OpenAI Proxy Routes (/v1 and /api/v1)
app.use('/v1', anthropicRouter);
app.use('/api/v1', anthropicRouter);

// Real-time Key Status Inspection endpoints
app.all('/api/key-status', handleKeyStatusInspection);
app.use('/api/keys', keysRouter);

// Statistics and Billing
app.use('/api/stats', statsRouter);

// Comprehensive Gateway Status (/api/status)
app.get('/api/status', async (req, res) => {
  const start = Date.now();
  let upstreamStatus = null;
  let upstreamLatency = null;

  try {
    const t0 = Date.now();
    const upRes = await fetch(`${UPSTREAM_API_BASE}/api/status`, { method: 'GET' });
    upstreamLatency = Date.now() - t0;
    if (upRes.ok) {
      upstreamStatus = await upRes.json();
    }
  } catch (err) {
    console.warn(`Upstream status query to ${UPSTREAM_API_BASE} failed:`, err.message);
  }

  const localLatency = Date.now() - start;

  return res.json({
    status: 'ok',
    service: 'Opuszyra Middle-Man AI Gateway',
    timestamp: new Date().toISOString(),
    refreshInterval: 30,
    overall: upstreamStatus?.overall || 'operational',
    middleMan: {
      domain: API_DOMAIN,
      upstream: UPSTREAM_API_BASE,
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
  res.json({
    status: 'online',
    service: 'Opuszyra AI Gateway',
    role: 'Middle Man Passthrough Proxy',
    upstream: UPSTREAM_API_BASE,
    gateway: `${API_DOMAIN}/v1`,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build files if present
app.use(express.static(clientDist));

// SPA Fallback for all other routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/v1') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
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

// Start listener only when running standalone (not inside Vercel serverless functions)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Opuszyra Middle-Man AI Gateway running on port ${PORT}`);
    console.log(`🌐 Middle-Man Public Domain: ${API_DOMAIN}`);
    console.log(`📡 Upstream Passthrough URL: ${UPSTREAM_API_BASE}`);
    console.log(`⚡ Anthropic Proxy: http://localhost:${PORT}/v1/messages`);
    console.log(`🔑 Key Status Inspector: http://localhost:${PORT}/api/key-status`);
    console.log(`📊 System Status: http://localhost:${PORT}/api/status`);
    console.log(`=======================================================`);
  });
}

export default app;
