import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded reliably across root and server runtime working directories
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Reads and validates the configured UPSTREAM_API_BASE exclusively from process.env.
 * Throws a clear configuration error if missing or invalid.
 * Prevents trailing slashes and duplicate /v1 path segments.
 */
export function getUpstreamBase() {
  const raw = process.env.UPSTREAM_API_BASE;
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    throw new Error('UPSTREAM_API_BASE environment variable is not configured.');
  }

  const trimmed = raw.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid UPSTREAM_API_BASE URL format: "${trimmed}"`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`UPSTREAM_API_BASE must use http or https protocol (got "${parsed.protocol}").`);
  }

  // Remove trailing slashes and strip trailing /v1 to prevent duplicate path segments
  return trimmed.replace(/\/+$/, '').replace(/\/v1$/, '');
}

/**
 * Reads the upstream API master credential exclusively from process.env.UPSTREAM_API_KEY.
 * Never prints, exposes, or hardcodes secret values.
 */
export function getMasterUpstreamKey() {
  const key = process.env.UPSTREAM_API_KEY;
  if (!key || typeof key !== 'string') {
    return '';
  }
  return key.trim();
}
