import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

const getUpstreamBase = () => (process.env.UPSTREAM_API_BASE || 'https://api.opuszen.shop').replace(/\/+$/, '');

// Helper: refresh 5-hour window if expired locally
const evaluateRollingWindow = (key) => {
  const now = new Date();
  const resetAt = new Date(key.window_resets_at || now.getTime() + 5 * 60 * 60 * 1000);
  
  if (now >= resetAt) {
    const newReset = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
    key.window_started_at = now.toISOString();
    key.window_resets_at = newReset;
    key.window_tokens_used = 0;
  }
  
  const msRemaining = Math.max(0, new Date(key.window_resets_at).getTime() - now.getTime());
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsMod = Math.floor((msRemaining % (1000 * 60)) / 1000);
  const secondsRemaining = Math.floor(msRemaining / 1000);

  const limit = Number(key.window_token_limit || 25000000);
  const used = Number(key.window_tokens_used || 0);
  const percentUsed = Math.min(100, Math.round((used / limit) * 100));
  const percentRemaining = Math.max(0, 100 - percentUsed);

  return {
    ...key,
    percentUsed,
    percentRemaining,
    timeRemainingFormatted: `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsMod).padStart(2, '0')}`,
    secondsRemaining
  };
};

// Core Key Status Inspector (queries upstream https://api.opuszen.shop/api/key-status + local DB)
export const handleKeyStatusInspection = async (req, res) => {
  try {
    let keyToken = req.body?.key || req.body?.key_token || req.body?.token || req.query?.key || req.query?.token;
    
    if (!keyToken) {
      const auth = req.headers['authorization'];
      if (auth && auth.startsWith('Bearer ')) {
        keyToken = auth.substring(7);
      } else if (req.headers['x-api-key']) {
        keyToken = req.headers['x-api-key'];
      }
    }

    if (!keyToken || typeof keyToken !== 'string' || !keyToken.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing API key. Pass ?key=YOUR_KEY, Authorization: Bearer YOUR_KEY, or a JSON body with { "key": "..." }.'
      });
    }

    const trimmedKey = keyToken.trim();
    const upstreamBase = getUpstreamBase();

    // 1. Fetch real-time status from upstream API (https://api.opuszen.shop/api/key-status)
    let upstreamData = null;
    try {
      // First try GET with query string (upstream primary format)
      const getRes = await fetch(`${upstreamBase}/api/key-status?key=${encodeURIComponent(trimmedKey)}`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      });
      if (getRes.ok) {
        upstreamData = await getRes.json();
      } else {
        // Fallback to POST with JSON body
        const postRes = await fetch(`${upstreamBase}/api/key-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ key: trimmedKey }),
          signal: AbortSignal.timeout(5000)
        });
        if (postRes.ok) {
          upstreamData = await postRes.json();
        }
      }
    } catch (upErr) {
      console.warn(`Upstream key-status query to ${upstreamBase} warning:`, upErr.message);
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

    // If neither upstream nor local key was found
    if (!upstreamData && !localRecord) {
      return res.status(404).json({
        success: false,
        error: 'Key not found or invalid format. Please check your token.'
      });
    }

    // Compute unified status values
    const now = new Date();
    const resetTimeStr = upstreamData?.windowResetAt || localRecord?.window_resets_at || new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
    const resetDate = new Date(resetTimeStr);
    const msRemaining = Math.max(0, resetDate.getTime() - now.getTime());
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const secondsMod = Math.floor((msRemaining % (1000 * 60)) / 1000);
    const secondsRemaining = Math.floor(msRemaining / 1000);

    const tokenLimit = upstreamData?.windowTokensLimit || localRecord?.window_token_limit || 10000000;
    const tokensUsed = upstreamData?.windowTokensUsed ?? (localRecord?.window_tokens_used || 0);
    const remainingTokens = upstreamData?.remainingTokens ?? Math.max(0, tokenLimit - tokensUsed);
    const percentUsed = upstreamData?.usagePercent ?? Math.min(100, Math.round((tokensUsed / tokenLimit) * 100));
    const percentRemaining = Math.max(0, 100 - percentUsed);

    const masked = trimmedKey.length > 12 
      ? `${trimmedKey.slice(0, 14)}...${trimmedKey.slice(-4)}`
      : trimmedKey;

    const allowedModels = upstreamData?.allowedModels || [
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001'
    ];

    const result = {
      success: true,
      status: 'ok',
      isRealtime: upstreamData?.isRealtime ?? true,
      keyStatus: upstreamData?.keyStatus || localRecord?.status || 'active',
      name: upstreamData?.name || localRecord?.name || 'API Key',
      key: {
        id: localRecord?.id || 'upstream-key',
        name: upstreamData?.name || localRecord?.name || 'API Key',
        key_token: trimmedKey,
        masked_token: masked,
        tier: localRecord?.tier || (tokenLimit >= 50000000 ? '20x' : '5x'),
        status: upstreamData?.keyStatus || localRecord?.status || 'active',
        rate_limit_rpm: upstreamData?.rateLimit || localRecord?.rate_limit_rpm || 60,
        rate_limit_tpm: localRecord?.rate_limit_tpm || 400000,
        window_token_limit: tokenLimit,
        window_tokens_used: tokensUsed,
        window_tokens_remaining: remainingTokens,
        percentUsed,
        percentRemaining,
        timeRemainingFormatted: `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsMod).padStart(2, '0')}`,
        secondsRemaining,
        window_started_at: localRecord?.window_started_at || new Date(resetDate.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        window_resets_at: resetTimeStr,
        total_tokens_consumed: localRecord?.total_tokens_consumed || tokensUsed,
        total_requests: upstreamData?.totalRequests ?? (localRecord?.total_requests || 0),
        successRequests: upstreamData?.successRequests ?? 0,
        failedRequests: upstreamData?.failedRequests ?? 0,
        last24hRequests: upstreamData?.last24h?.requests ?? 0,
        allocatedCredits: upstreamData?.allocatedCredits ?? 0,
        usedCredits: upstreamData?.usedCredits ?? 0,
        remainingCredits: upstreamData?.remainingCredits ?? 0,
        models_accessible: allowedModels,
        allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
        connectionStatus: upstreamData?.connectionStatus || 'Online',
        unlimited: upstreamData?.unlimited ?? false,
        windowActive: upstreamData?.windowActive ?? true,
        rawPayload: upstreamData
      },
      // Upstream-compatible root fields
      unlimited: upstreamData?.unlimited ?? false,
      usagePercent: percentUsed,
      totalRequests: upstreamData?.totalRequests ?? (localRecord?.total_requests || 0),
      successRequests: upstreamData?.successRequests ?? 0,
      failedRequests: upstreamData?.failedRequests ?? 0,
      last24h: upstreamData?.last24h || { requests: upstreamData?.totalRequests || 0 },
      rateLimit: upstreamData?.rateLimit || 60,
      connectionStatus: upstreamData?.connectionStatus || 'Online',
      isActive: true,
      windowActive: true,
      windowTokensLimit: tokenLimit,
      windowTokensUsed: tokensUsed,
      remainingTokens,
      windowResetAt: resetTimeStr,
      allowedModels,
      allowedProviders: upstreamData?.allowedProviders || ['opuslive'],
      allocatedCredits: upstreamData?.allocatedCredits ?? 0,
      usedCredits: upstreamData?.usedCredits ?? 0,
      remainingCredits: upstreamData?.remainingCredits ?? 0,
      recentLogs: upstreamData?.recentLogs || [],
      rawPayload: upstreamData
    };

    return res.json(result);
  } catch (err) {
    console.error('Error inspecting key:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Mount Key Inspection routes
router.post('/check', handleKeyStatusInspection);
router.post('/status', handleKeyStatusInspection);
router.get('/status', handleKeyStatusInspection);

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

    const limitTokens = tier === '20x' ? 100000000 : 25000000;
    const rpm = tier === '20x' ? 120 : 60;
    const tpm = tier === '20x' ? 1000000 : 400000;
    const durationDays = tier === '5x_trial' ? 7 : 30;

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

    return res.json({ success: true, message: '5-hour window reset successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
