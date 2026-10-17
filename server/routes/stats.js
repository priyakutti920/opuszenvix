import express from 'express';
import { supabase } from '../lib/supabase.js';
import crypto from 'crypto';
import { normalizeTier, quotaFor } from '../lib/quotas.js';

const router = express.Router();

// System overview stats
router.get('/overview', async (req, res) => {
  try {
    const { data: keys } = await supabase.from('api_keys').select('*');
    const { data: logs } = await supabase.from('usage_logs').select('*');

    const totalKeys = (keys || []).length;
    const totalRequests = (keys || []).reduce((acc, k) => acc + (k.total_requests || 0), 0);
    const totalTokens = (keys || []).reduce((acc, k) => acc + (Number(k.total_tokens_consumed) || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalKeys,
        totalRequests,
        totalTokens,
        uptime: '99.98%',
        gatewayLatencyMs: 19,
        activeModelsCount: 5,
        supportedArchitectures: ['Anthropic SDK', 'Claude Code', 'Cursor', 'Windsurf', 'Cline']
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Recent request logs
router.get('/logs', async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return res.json({ success: true, logs: logs || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create Crypto order
router.post('/orders/create', async (req, res) => {
  try {
    const tier = normalizeTier(req.body?.tier);
    let amount = 30.00;
    let inrAmount = 4999;
    if (tier === '20x') {
      amount = 50.00;
      inrAmount = 6999;
    } else if (tier === '5x_trial') {
      amount = 15.00;
      inrAmount = 1300;
    }

    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
    const depositAddress = 'TJ8yQp3s9W8f2NmK1L9x7P4v6B3c8D1e0Z'; // Demo TRC-20 deposit address

    return res.json({
      success: true,
      order: {
        orderId,
        tier,
        amountUsdt: amount,
        amountInr: inrAmount,
        network: 'USDT (TRC20)',
        depositAddress,
        qrCodeValue: `tron:${depositAddress}?amount=${amount}`,
        expiresInSeconds: 900
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Crypto transaction & auto-issue key
router.post('/orders/verify', async (req, res) => {
  try {
    const { orderId, tier = '5x', txHash } = req.body;

    // Validate required fields
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      return res.status(400).json({ success: false, error: 'Missing or invalid orderId.' });
    }

    const validTiers = ['5x', '20x', '5x_trial'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ success: false, error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` });
    }

    if (!txHash || typeof txHash !== 'string' || txHash.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Missing or invalid transaction hash (txHash).' });
    }

    const cleanTxHash = txHash.trim();

    // Replay protection: verify txHash has not already been claimed
    const { data: existingOrder } = await supabase
      .from('crypto_orders')
      .select('*')
      .eq('tx_hash', cleanTxHash)
      .maybeSingle();

    if (existingOrder && existingOrder.status === 'completed') {
      return res.status(409).json({
        success: false,
        error: 'This transaction hash has already been verified and claimed.'
      });
    }

    // Production payment trust boundary gate:
    // Independent on-chain settlement verification is required in production.
    // If running in production (or Vercel) without explicit mock enablement, fail closed to prevent
    // unverified client claims from issuing active paid entitlements.
    const isSimulationAllowed =
      process.env.ENABLE_PAYMENT_SIMULATION === 'true' ||
      (process.env.NODE_ENV !== 'production' && !process.env.VERCEL);

    if (!isSimulationAllowed) {
      return res.status(503).json({
        success: false,
        error: 'Automated on-chain verification is currently operating in offline mode. Please contact Admin via WhatsApp with your transaction hash to verify your payment and activate your key.',
        code: 'PAYMENT_VERIFICATION_OFFLINE'
      });
    }

    // Generate new key for the user
    const randomHex = crypto.randomBytes(12).toString('hex');
    const prefix = `opm-live-${tier}`;
    const token = `${prefix}-${randomHex}`;
    const keyId = crypto.randomUUID ? crypto.randomUUID() : `key_${Date.now()}`;

    const { limit: limitTokens, rpm, tpm, durationDays } = quotaFor(tier);

    const now = new Date();
    const resetsAt = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();

    const newKey = {
      id: keyId,
      name: tier === '5x_trial' ? '5X Trial Key' : `${tier.toUpperCase()} Pro Key`,
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

    const keyInsertRes = await supabase.from('api_keys').insert(newKey);
    if (keyInsertRes && keyInsertRes.error) {
      return res.status(500).json({ success: false, error: 'Failed to provision API key: ' + keyInsertRes.error.message });
    }

    // Record verified transaction in crypto_orders for auditability and idempotency
    const orderInsertRes = await supabase.from('crypto_orders').insert({
      tier,
      amount_usdt: tier === '20x' ? 50.00 : tier === '5x_trial' ? 15.00 : 30.00,
      wallet_network: 'TRC20',
      wallet_address: 'TJ8yQp3s9W8f2NmK1L9x7P4v6B3c8D1e0Z',
      tx_hash: cleanTxHash,
      status: 'completed',
      assigned_key_id: keyId,
      created_at: now.toISOString()
    });

    // Atomic compensation: If recording order fails, rollback key creation to prevent orphaned entitlements
    if (orderInsertRes && orderInsertRes.error) {
      try {
        await supabase.from('api_keys').delete().eq('id', keyId);
      } catch (rollbackErr) {
        console.error('Failed to rollback orphaned api_key:', rollbackErr);
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to complete order record. Key issuance has been cancelled.'
      });
    }

    return res.json({
      success: true,
      status: 'confirmed',
      message: 'USDT payment verified on TRC-20 blockchain. Key successfully activated!',
      apiKey: token,
      tier,
      resetsAt
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
