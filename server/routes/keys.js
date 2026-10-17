import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getUpstreamBase, getMasterUpstreamKey } from '../lib/config.js';
import { quotaFor } from '../lib/quotas.js';
import { calculateSlidingWindowUsage } from '../lib/quotaEngine.js';
import { redactKeyToken } from '../lib/security.js';

const router = express.Router();

// In-memory persistent window anchors (persists established window expiration across re-checks & refreshes)
const windowAnchors = new Map();

// Helper: refresh 5-hour window evaluation
export const evaluateRollingWindow = (key) => {
  const now = new Date();
  const limit = Number(key.window_token_limit) || quotaFor(key.tier).limit;
  const used = Number(key.window_tokens_used || 0);
  const remaining = Math.max(0, limit - used);
  const percentUsed = Math.min(100, Number(((used / limit) * 100).toFixed(1)));
  const percentRemaining = Math.max(0, Number((100 - percentUsed).toFixed(1)));

  const resetAt = new Date(key.window_resets_at || (now.getTime() + 5 * 60 * 60 * 1000));
  const msRemaining = Math.max(0, resetAt.getTime() - now.getTime());
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsMod = Math.floor((msRemaining % (1000 * 60)) / 1000);
  const secondsRemaining = Math.floor(msRemaining / 1000);

  return {
    ...key,
    window_token_limit: limit,
    window_tokens_used: used,
    window_tokens_remaining: remaining,
    percentUsed,
    percentRemaining,
    timeRemainingFormatted: `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsMod).padStart(2, '0')}`,
    secondsRemaining
  };
};

// Default model set, used only when neither the upstream key-status record nor
// the live /v1/models catalog yields a usable list.
const FALLBACK_MODELS = [
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-sonnet-5',
  'claude-opus-4-8',
  'claude-sonnet-4-6'
];

// Pull the model ids the gateway actually serves, so the "Supported Models on
// this Key" chips reflect reality instead of a stale hardcoded array.
// Runs concurrently with the key-status call and never blocks the response:
// any config or network failure just returns [] and the caller falls back.
const fetchLiveModelIds = async (upstreamBase) => {
  if (!upstreamBase) return [];
  try {
    const masterKey = getMasterUpstreamKey();
    const res = await fetch(`${upstreamBase}/v1/models`, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'Accept': 'application/json',
        ...(masterKey ? { 'x-api-key': masterKey, 'Authorization': `Bearer ${masterKey}` } : {})
      }
    });
    if (!res.ok) return [];
    const parsed = await res.json();
    const ids = Array.isArray(parsed?.data)
      ? parsed.data.map((m) => m?.id).filter((id) => typeof id === 'string' && id.trim())
      : [];
    return collapseModelIds(ids);
  } catch (err) {
    console.warn(`Upstream /v1/models fetch warning:`, err.message);
    return [];
  }
};

// The upstream catalog lists a separate entry per context-length variant
// (claude-opus-5-5 and claude-opus-5-5[1m]). Those are the same model, so the
// chip row would otherwise print near-duplicates — 24 entries instead of 15.
// Keep the first-seen id for each base model, preserving catalog order.
const collapseModelIds = (ids) => {
  const seen = new Set();
  const collapsed = [];
  for (const id of ids) {
    const base = id.replace(/\[[^\]]*\]\s*$/, '').trim();
    if (!base || seen.has(base)) continue;
    seen.add(base);
    collapsed.push(base);
  }
  return collapsed;
};

// Helper: Sanitize object payloads to ensure sensitive credentials are never leaked
export const sanitizePayload = (obj, masterKey) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizePayload(item, masterKey));

  const sensitiveKeys = new Set(['key', 'apikey', 'key_token', 'keytoken', 'token', 'authorization', 'secret']);
  const sanitized = {};

  for (const [k, v] of Object.entries(obj)) {
    const lowerKey = k.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      if (typeof v === 'string') {
        sanitized[k] = redactKeyToken(v) || (v.length > 8 ? `${v.slice(0, 6)}…${v.slice(-4)}` : '••••••••');
      } else {
        sanitized[k] = undefined;
      }
    } else if (typeof v === 'string' && masterKey && v.includes(masterKey)) {
      sanitized[k] = v.replaceAll(masterKey, '[REDACTED_MASTER_KEY]');
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitizePayload(v, masterKey);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
};

// Helper: Verify whether request has valid administrative credentials
export const verifyAdminAuth = (req) => {
  const adminKey = (process.env.ADMIN_API_KEY || '').trim();
  if (!adminKey) {
    // If ADMIN_API_KEY is unset, the gateway keeps admin telemetry open for local operators
    // matching the opt-in adminKeyRequired security model in server/lib/security.js
    return true;
  }
  const candidate = (
    req.headers['x-admin-key'] ||
    (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null) ||
    req.headers['x-api-key'] ||
    ''
  ).trim();
  return Boolean(candidate && candidate === adminKey);
};

// Helper: Serve safe, non-sensitive master key telemetry for authorized admins
export const serveMasterTelemetry = async (req, res, masterKey, upstreamBase) => {
  try {
    if (!masterKey) {
      return res.status(503).json({
        type: 'error',
        error: {
          type: 'service_unavailable',
          message: 'Upstream master API key is not configured on this server.'
        }
      });
    }

    const liveModelsPromise = fetchLiveModelIds(upstreamBase);
    let upstreamData = null;
    if (upstreamBase) {
      try {
        const getRes = await fetch(`${upstreamBase}/api/key-status?key=${encodeURIComponent(masterKey)}`, {
          signal: AbortSignal.timeout(8000),
          headers: { Accept: 'application/json' }
        });
        if (getRes.ok) {
          const parsed = await getRes.json();
          if (parsed && parsed.status !== 'error' && parsed.error !== 'API key not found') {
            upstreamData = parsed;
          }
        }
      } catch (upErr) {
        console.warn('Upstream master key-status fetch warning:', (upErr.message || '').replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]'));
      }
    }

    const now = new Date();
    const tier = '20x';
    const defaultLimit = quotaFor(tier).limit;
    const rawUpstreamLimit = Number(upstreamData?.windowTokensLimit);
    const tokenLimit = rawUpstreamLimit && rawUpstreamLimit !== 100000000 && rawUpstreamLimit !== 200000000
      ? rawUpstreamLimit
      : defaultLimit;

    const keyEntity = {
      id: 'upstream-master-key',
      key_token: masterKey,
      tier,
      window_token_limit: tokenLimit
    };

    const slidingUsage = await calculateSlidingWindowUsage(keyEntity, {
      upstreamData,
      now
    });

    const percentUsed = slidingUsage.usage_percentage;
    const tokensUsed = slidingUsage.used_tokens;
    const remainingTokens = slidingUsage.remaining_tokens;
    const percentRemaining = slidingUsage.remaining_percentage;
    const timeRemainingFormatted = slidingUsage.time_remaining_formatted;
    const secondsRemaining = slidingUsage.seconds_remaining;
    const resetTimeStr = upstreamData?.windowResetAt || slidingUsage.window_resets_at;
    const windowStartedAt = slidingUsage.window_started_at;

    const masked = masterKey.length > 12
      ? `${masterKey.slice(0, 10)}...${masterKey.slice(-4)}`
      : '••••••••••••';

    const upstreamModels = Array.isArray(upstreamData?.allowedModels) ? upstreamData.allowedModels : [];
    const liveModels = await liveModelsPromise;
    const allowedModels = upstreamModels.length > 0 ? upstreamModels : (liveModels.length > 0 ? liveModels : FALLBACK_MODELS);

    const recentLogs = Array.isArray(upstreamData?.recentLogs)
      ? upstreamData.recentLogs.map((log, idx) => ({
          id: `upstream-master-log-${idx}`,
          timestamp: log.time ? new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : 'Just now',
          model: log.model || 'claude-sonnet-4-6',
          tokens: log.tokens ?? '-',
          status: log.status ? `${log.status} OK` : '200 OK'
        }))
      : [];

    const finalByModel = (slidingUsage.byModel && Object.keys(slidingUsage.byModel).length > 0)
      ? slidingUsage.byModel
      : (upstreamData?.byModel || null);

    const safePayload = sanitizePayload(upstreamData, masterKey);

    const result = {
      success: true,
      status: 'ok',
      isMaster: true,
      isRealtime: upstreamData?.isRealtime ?? true,
      keyStatus: 'active',
      name: 'Master Upstream Key (Max 20x)',
      planName: 'Max 20x Key (Master)',
      planSource: 'provider',
      isPlanVerified: true,
      quotaSource: slidingUsage.quota_source,
      isQuotaVerified: slidingUsage.is_quota_verified,
      usageSource: slidingUsage.usage_source,
      isUsageVerified: slidingUsage.is_usage_verified,
      lastSyncTime: now.toISOString(),
      masked_token: masked,
      key: {
        id: 'upstream-master-key',
        name: 'Master Upstream Key (Max 20x)',
        masked_token: masked,
        tier,
        status: 'active',
        planName: 'Max 20x Key (Master)',
        planSource: 'provider',
        isPlanVerified: true,
        quotaSource: slidingUsage.quota_source,
        isQuotaVerified: slidingUsage.is_quota_verified,
        usageSource: slidingUsage.usage_source,
        isUsageVerified: slidingUsage.is_usage_verified,
        lastSyncTime: now.toISOString(),
        rate_limit_rpm: slidingUsage.rate_limit_rpm || 60,
        rate_limit_tpm: slidingUsage.rate_limit_tpm || 1000000,
        window_token_limit: slidingUsage.quota_limit,
        window_tokens_used: tokensUsed,
        window_tokens_remaining: remainingTokens,
        percentUsed,
        percentRemaining,
        timeRemainingFormatted,
        secondsRemaining,
        window_started_at: windowStartedAt,
        window_resets_at: resetTimeStr,
        created_at: upstreamData?.createdAt || windowStartedAt,
        expires_at: upstreamData?.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
        total_tokens_consumed: tokensUsed !== null ? tokensUsed : 0,
        total_requests: upstreamData?.totalRequests ?? 0,
        successRequests: upstreamData?.successRequests ?? 0,
        failedRequests: upstreamData?.failedRequests ?? 0,
        last24hRequests: upstreamData?.last24h?.requests ?? (upstreamData?.last24hRequests || 0),
        models_accessible: allowedModels,
        allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
        connectionStatus: upstreamData?.connectionStatus || 'Online',
        unlimited: upstreamData?.unlimited ?? false,
        windowActive: upstreamData?.windowActive ?? true,
        byModel: finalByModel,
        recentLogs: recentLogs.length > 0 ? recentLogs : undefined,
        rawPayload: safePayload
      },
      unlimited: upstreamData?.unlimited ?? false,
      usagePercent: percentUsed,
      totalRequests: upstreamData?.totalRequests ?? 0,
      successRequests: upstreamData?.successRequests ?? 0,
      failedRequests: upstreamData?.failedRequests ?? 0,
      last24h: upstreamData?.last24h || { requests: upstreamData?.last24hRequests || 0 },
      rateLimit: slidingUsage.rate_limit_rpm || 60,
      connectionStatus: upstreamData?.connectionStatus || 'Online',
      isActive: true,
      windowActive: true,
      windowTokensLimit: slidingUsage.quota_limit,
      windowTokensUsed: tokensUsed,
      remainingTokens,
      windowResetAt: resetTimeStr,
      allowedModels,
      allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
      allocatedCredits: upstreamData?.allocatedCredits ?? 0,
      usedCredits: upstreamData?.usedCredits ?? 0,
      remainingCredits: upstreamData?.remainingCredits ?? 0,
      byModel: finalByModel,
      recentLogs,
      rawPayload: safePayload
    };

    let jsonStr = JSON.stringify(result);
    if (masterKey && jsonStr.includes(masterKey)) {
      jsonStr = jsonStr.replaceAll(masterKey, '[REDACTED_MASTER_KEY]');
    }
    return res.type('application/json').send(jsonStr);
  } catch (err) {
    const safeError = (err?.message || 'Master key telemetry error.').replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
    return res.status(500).json({ success: false, error: safeError });
  }
};

// Admin-only Master Upstream Key telemetry endpoint handler
export const handleMasterStatusTelemetry = async (req, res) => {
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      type: 'error',
      error: {
        type: 'authentication_error',
        message: 'Missing or invalid admin credential.'
      }
    });
  }
  const masterKey = getMasterUpstreamKey();
  let upstreamBase = null;
  try {
    upstreamBase = getUpstreamBase();
  } catch {}
  return serveMasterTelemetry(req, res, masterKey, upstreamBase);
};

// Core Key Status Inspector (queries upstream /api/key-status + local DB)
export const handleKeyStatusInspection = async (req, res) => {
  try {
    let keyToken = req.params?.token || req.params?.key || req.body?.key || req.body?.key_token || req.body?.token || req.query?.key || req.query?.token;
    
    const auth = req.headers['authorization'];
    const xApiKey = req.headers['x-api-key'];
    let headerToken = null;
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      headerToken = auth.substring(7).trim();
    } else if (xApiKey && typeof xApiKey === 'string') {
      headerToken = xApiKey.trim();
    }

    if (!keyToken && headerToken) {
      keyToken = headerToken;
    }

    // Require an explicit key token; NEVER silently fall back to master key
    if (!keyToken || typeof keyToken !== 'string' || !keyToken.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing API key. Pass ?key=YOUR_KEY, Authorization: Bearer YOUR_KEY, or a JSON body with { "key": "..." }.'
      });
    }

    const trimmedKey = keyToken.trim();
    const masterKey = getMasterUpstreamKey();
    const isAdmin = verifyAdminAuth(req);

    // Cross-user key inspection check:
    // If caller authenticated with a header credential, they cannot inspect a different user's key without admin privileges
    if (headerToken && trimmedKey !== headerToken && !isAdmin) {
      return res.status(403).json({
        type: 'error',
        error: {
          type: 'permission_denied',
          message: 'Unauthorized: You cannot inspect another user’s API key.'
        }
      });
    }

    let upstreamBase = null;
    try {
      upstreamBase = getUpstreamBase();
    } catch {
      // UPSTREAM_API_BASE not configured
    }

    // Master key telemetry check:
    // Unauthenticated callers or non-admins cannot inspect the upstream master key
    const isMasterRequest = Boolean(trimmedKey === 'master' || (masterKey && trimmedKey === masterKey));
    if (isMasterRequest) {
      if (!isAdmin) {
        return res.status(401).json({
          type: 'error',
          error: {
            type: 'authentication_error',
            message: 'Admin authorization required to access master key telemetry.'
          }
        });
      }
      return serveMasterTelemetry(req, res, masterKey, upstreamBase);
    }

    // Kick off the live model catalog lookup up front so it overlaps the
    // key-status call below rather than adding its own round-trip to latency.
    const liveModelsPromise = fetchLiveModelIds(upstreamBase);

    // 1. Fetch real-time status from upstream API (/api/key-status)
    let upstreamData = null;
    if (upstreamBase) {
      try {
        // First try GET with query string (upstream primary format)
        const getRes = await fetch(`${upstreamBase}/api/key-status?key=${encodeURIComponent(trimmedKey)}`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/json' }
        });
        if (getRes.ok) {
          const parsed = await getRes.json();
          // Check if upstream returned a valid key record (and not an error payload)
          if (parsed && parsed.status !== 'error' && parsed.error !== 'API key not found') {
            upstreamData = parsed;
          }
        }
        
        // If GET didn't find it or failed, try POST
        if (!upstreamData) {
          const postRes = await fetch(`${upstreamBase}/api/key-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ key: trimmedKey }),
            signal: AbortSignal.timeout(8000)
          });
          if (postRes.ok) {
            const parsed = await postRes.json();
            if (parsed && parsed.status !== 'error' && parsed.error !== 'API key not found') {
              upstreamData = parsed;
            }
          }
        }
      } catch (upErr) {
        console.warn(`Upstream key-status query to ${upstreamBase} warning:`, upErr.message);
      }
    }

    // 2. Fetch local key record from Supabase if present
    let localRecord = null;
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_token', trimmedKey)
        .maybeSingle();
      if (data) localRecord = data;
    } catch {
      // Local DB offline/unreachable
    }

    // Key Validation Trust Boundary:
    const isUpstreamKeyValid = Boolean(
      upstreamData && (
        upstreamData.status === 'found' || 
        upstreamData.isActive === true || 
        (upstreamData.status !== 'error' && !upstreamData.error)
      )
    );

    if (!localRecord) {
      const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
      if (isSupabaseConfigured || isProduction) {
        // In production/configured DB mode, only accept genuinely verified upstream or DB keys
        if (!isUpstreamKeyValid) {
          return res.status(404).json({
            success: false,
            error: 'Key not found or invalid format. Please check your token.',
            code: 'KEY_NOT_FOUND'
          });
        }
      }
    }

    // If neither upstream nor local key was found
    if (!isUpstreamKeyValid && !localRecord) {
      return res.status(404).json({
        success: false,
        error: 'Key not found or invalid format. Please check your token.'
      });
    }

    // Unified status values & Window calculations
    const now = new Date();
    
    // Authoritative Plan & Tier detection (no inference from key prefix or RPM/TPM)
    let planName = 'Unverified Plan';
    let planSource = 'unverified';
    let isPlanVerified = false;

    if (upstreamData?.planName && typeof upstreamData.planName === 'string' && upstreamData.planName.trim()) {
      planName = upstreamData.planName.trim();
      planSource = 'provider';
      isPlanVerified = true;
    } else if (localRecord?.plan_name && typeof localRecord.plan_name === 'string' && localRecord.plan_name.trim()) {
      planName = localRecord.plan_name.trim();
      planSource = 'database';
      isPlanVerified = true;
    } else if (localRecord?.tier) {
      planName = `${localRecord.tier.toUpperCase()} Plan (Configured)`;
      planSource = 'database_tier';
      isPlanVerified = true;
    }

    // Tier mapping for internal rate/quota table lookup ('20x' or '5x')
    let tier = localRecord?.tier;
    if (!tier && upstreamData?.planName) {
      if (upstreamData.planName.toLowerCase().includes('20x')) tier = '20x';
      else if (upstreamData.planName.toLowerCase().includes('5x')) tier = '5x';
    }
    if (!tier) tier = '20x'; // Default internal tier allocation

    // Authoritative Quota Limit calculation (intended: 20,000,000 for Max 20x)
    const isLegacyStaleOverride = (t, val) =>
      t === '20x' && (val === 100000000 || val === 200000000);

    const defaultLimit = quotaFor(tier).limit;
    const rawUpstreamLimit = Number(upstreamData?.windowTokensLimit);
    const rawLocalLimit = Number(localRecord?.window_token_limit);

    let tokenLimit = defaultLimit;
    if (rawUpstreamLimit && !isLegacyStaleOverride(tier, rawUpstreamLimit)) {
      tokenLimit = rawUpstreamLimit;
    } else if (rawLocalLimit && !isLegacyStaleOverride(tier, rawLocalLimit)) {
      tokenLimit = rawLocalLimit;
    }

    // Build key entity for authoritative rolling 5-hour quota calculation
    const keyEntity = localRecord || {
      id: null,
      key_token: trimmedKey,
      tier,
      window_token_limit: tokenLimit
    };

    const slidingUsage = await calculateSlidingWindowUsage(keyEntity, {
      upstreamData,
      now
    });

    const percentUsed = slidingUsage.usage_percentage;
    const tokensUsed = slidingUsage.used_tokens;
    const remainingTokens = slidingUsage.remaining_tokens;
    const percentRemaining = slidingUsage.remaining_percentage;
    const timeRemainingFormatted = slidingUsage.time_remaining_formatted;
    const secondsRemaining = slidingUsage.seconds_remaining;
    const resetTimeStr = upstreamData?.windowResetAt || slidingUsage.window_resets_at;
    const windowStartedAt = slidingUsage.window_started_at;

    const masked = trimmedKey.length > 12 
      ? `${trimmedKey.slice(0, 10)}...${trimmedKey.slice(-4)}`
      : '••••••••••••';

    const upstreamModels = Array.isArray(upstreamData?.allowedModels) ? upstreamData.allowedModels : [];
    const liveModels = await liveModelsPromise;
    const allowedModels = upstreamModels.length > 0 ? upstreamModels : (liveModels.length > 0 ? liveModels : FALLBACK_MODELS);

    const recentLogs = Array.isArray(upstreamData?.recentLogs) 
      ? upstreamData.recentLogs.map((log, idx) => ({
          id: `upstream-log-${idx}`,
          timestamp: log.time ? new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) + ' (' + new Date(log.time).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ')' : 'Just now',
          model: log.model || 'claude-sonnet-4-6',
          tokens: log.tokens ?? '-',
          status: log.status ? `${log.status} OK` : '200 OK'
        }))
      : [];

    const keyName = upstreamData?.name || localRecord?.name || planName;
    const finalByModel = (slidingUsage.byModel && Object.keys(slidingUsage.byModel).length > 0)
      ? slidingUsage.byModel
      : (upstreamData?.byModel || null);

    const safePayload = sanitizePayload(upstreamData || localRecord, masterKey);

    const result = {
      success: true,
      status: 'ok',
      isRealtime: upstreamData?.isRealtime ?? true,
      keyStatus: (upstreamData?.isActive || upstreamData?.status === 'found') ? 'active' : (upstreamData?.keyStatus || localRecord?.status || 'active'),
      name: keyName,
      planName,
      planSource,
      isPlanVerified,
      quotaSource: slidingUsage.quota_source,
      isQuotaVerified: slidingUsage.is_quota_verified,
      usageSource: slidingUsage.usage_source,
      isUsageVerified: slidingUsage.is_usage_verified,
      lastSyncTime: now.toISOString(),
      masked_token: masked,
      key: {
        id: localRecord?.id || 'upstream-key',
        name: keyName,
        key_token: trimmedKey,
        masked_token: masked,
        tier,
        status: (upstreamData?.isActive || upstreamData?.status === 'found') ? 'active' : (upstreamData?.keyStatus || localRecord?.status || 'active'),
        planName,
        planSource,
        isPlanVerified,
        quotaSource: slidingUsage.quota_source,
        isQuotaVerified: slidingUsage.is_quota_verified,
        usageSource: slidingUsage.usage_source,
        isUsageVerified: slidingUsage.is_usage_verified,
        lastSyncTime: now.toISOString(),
        rate_limit_rpm: slidingUsage.rate_limit_rpm || 60,
        rate_limit_tpm: slidingUsage.rate_limit_tpm || (tier === '20x' ? 1000000 : 400000),
        window_token_limit: slidingUsage.quota_limit,
        window_tokens_used: tokensUsed,
        window_tokens_remaining: remainingTokens,
        percentUsed,
        percentRemaining,
        timeRemainingFormatted,
        secondsRemaining,
        window_started_at: windowStartedAt,
        window_resets_at: resetTimeStr,
        created_at: upstreamData?.createdAt || localRecord?.created_at || windowStartedAt,
        expires_at: upstreamData?.expiresAt || localRecord?.expires_at || new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
        total_tokens_consumed: localRecord?.total_tokens_consumed || (tokensUsed !== null ? tokensUsed : 0),
        total_requests: upstreamData?.totalRequests ?? (localRecord?.total_requests || 0),
        successRequests: upstreamData?.successRequests ?? 0,
        failedRequests: upstreamData?.failedRequests ?? 0,
        last24hRequests: upstreamData?.last24h?.requests ?? (upstreamData?.last24hRequests || 0),
        allocatedCredits: upstreamData?.allocatedCredits ?? 0,
        usedCredits: upstreamData?.usedCredits ?? 0,
        remainingCredits: upstreamData?.remainingCredits ?? 0,
        models_accessible: allowedModels,
        allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
        connectionStatus: upstreamData?.connectionStatus || 'Online',
        unlimited: upstreamData?.unlimited ?? false,
        windowActive: upstreamData?.windowActive ?? true,
        byModel: finalByModel,
        recentLogs: recentLogs.length > 0 ? recentLogs : undefined,
        rawPayload: safePayload
      },
      // Upstream-compatible root fields
      unlimited: upstreamData?.unlimited ?? false,
      usagePercent: percentUsed,
      totalRequests: upstreamData?.totalRequests ?? (localRecord?.total_requests || 0),
      successRequests: upstreamData?.successRequests ?? 0,
      failedRequests: upstreamData?.failedRequests ?? 0,
      last24h: upstreamData?.last24h || { requests: upstreamData?.last24hRequests || 0 },
      rateLimit: slidingUsage.rate_limit_rpm || 60,
      connectionStatus: upstreamData?.connectionStatus || 'Online',
      isActive: true,
      windowActive: true,
      windowTokensLimit: slidingUsage.quota_limit,
      windowTokensUsed: tokensUsed,
      remainingTokens,
      windowResetAt: resetTimeStr,
      allowedModels,
      allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
      allocatedCredits: upstreamData?.allocatedCredits ?? 0,
      usedCredits: upstreamData?.usedCredits ?? 0,
      remainingCredits: upstreamData?.remainingCredits ?? 0,
      byModel: finalByModel,
      recentLogs,
      rawPayload: safePayload
    };

    let jsonStr = JSON.stringify(result);
    if (masterKey && jsonStr.includes(masterKey)) {
      jsonStr = jsonStr.replaceAll(masterKey, '[REDACTED_MASTER_KEY]');
    }

    return res.type('application/json').send(jsonStr);
  } catch (err) {
    const safeError = (err?.message || 'Key inspection encountered an error.').replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
    return res.status(500).json({ success: false, error: safeError });
  }
};

// Mount Master Status Admin Telemetry routes
router.get('/master-status', handleMasterStatusTelemetry);
router.post('/master-status', handleMasterStatusTelemetry);

// Mount Key Inspection routes (supporting query, body, and slug parameter)
router.all(['/check', '/check/:token', '/check/:token/*'], handleKeyStatusInspection);
router.all(['/status', '/status/:token', '/status/:token/*'], handleKeyStatusInspection);
router.all(['/:token/status'], handleKeyStatusInspection);

// 1. Get all API keys (from local Supabase DB)
router.get('/', async (req, res) => {
  try {
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const evaluatedKeys = (keys || []).map(evaluateRollingWindow);
    return res.json({ success: true, keys: evaluatedKeys });
  } catch (err) {
    console.error('Error fetching keys:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Generate a new API Key
router.post('/', async (req, res) => {
  try {
    const { name = 'Developer Key', tier = '5x' } = req.body;
    const randomHex = crypto.randomBytes(12).toString('hex');
    const prefix = `opm-live-${tier}`;
    const token = `${prefix}-${randomHex}`;

    const { limit: limitTokens, rpm, tpm, durationDays } = quotaFor(tier);

    const now = new Date();
    const resetsAt = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();

    const newKey = {
      id: uuidv4(),
      name,
      key_prefix: prefix,
      key_token: token,
      tier,
      status: 'active',
      rate_limit_rpm: rpm,
      rate_limit_tpm: tpm,
      window_token_limit: limitTokens,
      window_tokens_used: 0,
      window_started_at: now.toISOString(),
      window_resets_at: resetsAt,
      total_tokens_consumed: 0,
      total_requests: 0,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    };

    const { error } = await supabase.from('api_keys').insert(newKey);
    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully',
      key: evaluateRollingWindow(newKey)
    });
  } catch (err) {
    console.error('Error generating key:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Revoke / Delete a Key
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, message: 'Key revoked successfully' });
  } catch (err) {
    console.error('Error deleting key:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Reset window (developer utility)
router.post('/:id/reset-window', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const resetsAt = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
    
    await supabase.from('api_keys').update({
      window_tokens_used: 0,
      window_started_at: now.toISOString(),
      window_resets_at: resetsAt
    }).eq('id', id);

    // Clear memory anchor
    for (const [key] of windowAnchors.entries()) {
      windowAnchors.delete(key);
    }

    return res.json({ success: true, message: '5-hour window reset successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
