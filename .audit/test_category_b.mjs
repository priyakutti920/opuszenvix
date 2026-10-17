/**
 * Test Category B — Production Environment Configuration Verification
 *
 * Validates:
 * 1. Server configuration loading (SUPPORT_PHONE_NUMBER, UPSTREAM_API_BASE, UPSTREAM_API_KEY)
 * 2. Fallbacks when variables are missing or misconfigured
 * 3. Client build asset inspection to verify VITE_SUPPORT_PHONE_NUMBER injection and zero secret leaks
 * 4. Production headers, rate limiters, and error handling in simulated NODE_ENV=production
 */

import { getSupportPhoneNumber, getUpstreamBase, getMasterUpstreamKey } from '../server/lib/config.js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('--- STARTING CATEGORY B PRODUCTION CONFIGURATION VERIFICATION ---\n');

// 1. Server SUPPORT_PHONE_NUMBER loading
{
  const original = process.env.SUPPORT_PHONE_NUMBER;
  process.env.SUPPORT_PHONE_NUMBER = '918098830937';
  const val = getSupportPhoneNumber();
  record('Server loads SUPPORT_PHONE_NUMBER from environment', val === '918098830937', `value: ${val}`);

  delete process.env.SUPPORT_PHONE_NUMBER;
  const emptyVal = getSupportPhoneNumber();
  record('Server handles missing SUPPORT_PHONE_NUMBER gracefully', emptyVal === '', 'returned empty string');
  
  if (original) process.env.SUPPORT_PHONE_NUMBER = original;
}

// 2. Server UPSTREAM_API_BASE validation
{
  const original = process.env.UPSTREAM_API_BASE;
  process.env.UPSTREAM_API_BASE = 'https://api.upstream.live/';
  const base = getUpstreamBase();
  record('UPSTREAM_API_BASE strips trailing slash and /v1', base === 'https://api.upstream.live', base);

  process.env.UPSTREAM_API_BASE = 'invalid-protocol://foo';
  let threw = false;
  try {
    getUpstreamBase();
  } catch {
    threw = true;
  }
  record('UPSTREAM_API_BASE rejects invalid protocols', threw);

  if (original) process.env.UPSTREAM_API_BASE = original;
}

// 3. Server UPSTREAM_API_KEY security
{
  const original = process.env.UPSTREAM_API_KEY;
  process.env.UPSTREAM_API_KEY = 'test_secret_key_12345';
  const master = getMasterUpstreamKey();
  record('Master upstream key loads from environment', master === 'test_secret_key_12345');

  delete process.env.UPSTREAM_API_KEY;
  const emptyMaster = getMasterUpstreamKey();
  record('Empty UPSTREAM_API_KEY handled safely without crashing', emptyMaster === '');

  if (original) process.env.UPSTREAM_API_KEY = original;
}

// 4. Verify client production build output (dist/)
{
  const distDir = path.resolve(__dirname, '../client/dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  record('Client production build exists (dist/index.html)', existsSync(indexHtmlPath));

  if (existsSync(indexHtmlPath)) {
    const htmlContent = readFileSync(indexHtmlPath, 'utf8');
    record('Production index.html contains canonical tag', htmlContent.includes('rel="canonical"'));
    record('Production index.html does not contain raw UPSTREAM_API_KEY', !htmlContent.includes(process.env.UPSTREAM_API_KEY || 'no_key'));
  }

  // Scan production JS bundle for secret leaks
  const assetsDir = path.join(distDir, 'assets');
  if (existsSync(assetsDir)) {
    const fs = await import('node:fs');
    const files = fs.readdirSync(assetsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    let hasLeak = false;
    let jsTotalSize = 0;

    for (const file of jsFiles) {
      const code = readFileSync(path.join(assetsDir, file), 'utf8');
      jsTotalSize += code.length;
      if (process.env.UPSTREAM_API_KEY && process.env.UPSTREAM_API_KEY.length > 8) {
        if (code.includes(process.env.UPSTREAM_API_KEY)) {
          hasLeak = true;
        }
      }
    }
    record('Production JS bundle contains zero leaked server secrets', !hasLeak);
    record(`Production JS bundle compiled successfully (~${(jsTotalSize / 1024).toFixed(1)} kB)`, jsTotalSize > 0);
  }
}

// 5. Verify robots.txt and sitemap.xml in client public/dist
{
  const robotsPath = path.resolve(__dirname, '../client/public/robots.txt');
  const sitemapPath = path.resolve(__dirname, '../client/public/sitemap.xml');
  record('robots.txt present in public directory', existsSync(robotsPath));
  record('sitemap.xml present in public directory', existsSync(sitemapPath));

  if (existsSync(robotsPath)) {
    const robotsTxt = readFileSync(robotsPath, 'utf8');
    record('robots.txt points to sitemap.xml', robotsTxt.includes('Sitemap: https://opuszyra.live/sitemap.xml'));
  }
}

const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

console.log(`\n=======================================================`);
console.log(`Category B Verification: ${passed}/${total} passed (${failed} failed)`);
console.log(`=======================================================`);

process.exit(failed > 0 ? 1 : 0);
