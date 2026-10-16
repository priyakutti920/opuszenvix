import app from '../server/server.js';

export default function handler(req, res) {
  // Restore original URL if Vercel rewrote /v1/* or /api/* to /api
  const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-now-route-matches'];
  if (originalUrl && (req.url === '/api' || req.url === '/api/')) {
    req.url = originalUrl;
  }
  return app(req, res);
}
