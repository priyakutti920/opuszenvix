/**
 * Canonical tier → quota map for the whole gateway.
 *
 * Every quota-assigning surface (key minting, order verification, status
 * fallbacks) reads from this single table. The old copies disagreed with
 * each other — one tier said 10M tokens, another said 100M — so a key's
 * reported allowance depended on which endpoint happened to describe it.
 *
 * Unrecognised tiers fall back to the smallest paid tier so a typo such as
 * `tier: "20Ox"` can never silently mint a larger allowance.
 */
export const TIER_QUOTAS = {
  '5x': { limit: 5000000, rpm: 60, tpm: 400000, durationDays: 30 },
  '20x': { limit: 20000000, rpm: 120, tpm: 1000000, durationDays: 30 },
  '5x_trial': { limit: 5000000, rpm: 60, tpm: 400000, durationDays: 7 },
  custom: { limit: 5000000, rpm: 60, tpm: 400000, durationDays: 30 },
};

export const DEFAULT_TIER = '5x';

export const normalizeTier = (tier) => {
  if (typeof tier !== 'string') return DEFAULT_TIER;
  const clean = tier.trim().toLowerCase();
  if (clean === 'max_5x' || clean === 'max-5x' || clean === '5x') return '5x';
  if (clean === 'max_20x' || clean === 'max-20x' || clean === '20x') return '20x';
  return TIER_QUOTAS[clean] ? clean : DEFAULT_TIER;
};

/** Quota block for a tier, always the normalised tier's block. */
export const quotaFor = (tier) => TIER_QUOTAS[normalizeTier(tier)];

/**
 * Detect legacy / stale override numbers from outdated schemas, stale cache,
 * or upstream fixtures (e.g. old 25M / 2.5M for 5x, or 100M / 200M for 20x).
 */
export const isLegacyStaleOverride = (tier, val) => {
  const num = Number(val);
  if (!num || Number.isNaN(num)) return false;
  const normalized = normalizeTier(tier);
  if (normalized === '20x') {
    return num === 100000000 || num === 200000000;
  }
  // 5x, 5x_trial, custom
  return num === 25000000 || num === 2500000 || num === 100000000 || num === 200000000;
};
