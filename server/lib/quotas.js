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
  '5x': { limit: 25000000, rpm: 60, tpm: 400000, durationDays: 30 },
  '20x': { limit: 20000000, rpm: 120, tpm: 1000000, durationDays: 30 },
  '5x_trial': { limit: 25000000, rpm: 60, tpm: 400000, durationDays: 7 },
  custom: { limit: 25000000, rpm: 60, tpm: 400000, durationDays: 30 },
};

export const DEFAULT_TIER = '5x';

export const normalizeTier = (tier) =>
  (typeof tier === 'string' && TIER_QUOTAS[tier]) ? tier : DEFAULT_TIER;

/** Quota block for a tier, always the normalised tier's block. */
export const quotaFor = (tier) => TIER_QUOTAS[normalizeTier(tier)];
