import app from '../server/server.js';

export default function handler(req, res) {
  // Support Vercel serverless path rewrites
  const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (originalUrl && (req.url === '/api' || req.url === '/api/index' || req.url === '/api/index.js')) {
    req.url = originalUrl;
  }
  return app(req, res);
}
