import React, { useState, useEffect } from 'react';
import { X, Check, Copy, ShieldCheck, Zap, AlertCircle, ArrowRight, ExternalLink, CreditCard, MessageCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createCryptoOrder, verifyCryptoOrder, generateKey } from '../lib/api';
import { ApiKey, PlanTier } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import { getWhatsAppSupportUrl } from '../lib/support';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyAcquired?: (key: ApiKey) => void;
}

const MODAL_PLANS: {
  tier: PlanTier;
  title: string;
  badge: string;
  priceInr: string;
  duration: string;
  features: string[];
}[] = [
  {
    tier: '5x',
    title: '5x Plan',
    badge: 'Standard Dev',
    priceInr: '₹4,999',
    duration: '30 days',
    features: [
      '5× the usage of official Claude Pro',
      'All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku',
      '30 days of access',
      'Vision, web search and extended thinking',
      'Full SSE streaming & built-in tools',
      'Works with Claude Code, Cursor, VS Code, Windsurf'
    ]
  },
  {
    tier: '20x',
    title: '20x Plan',
    badge: 'Most Popular',
    priceInr: '₹6,999',
    duration: '30 days',
    features: [
      '20× the usage of official Claude Pro',
      'All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku',
      'Rolling 5-hour window — resets itself',
      'Vision, web search and extended thinking',
      'Full SSE streaming & Anthropic SDK compatible',
      'Real-time usage dashboard & API key management',
      'Priority support'
    ]
  },
  {
    tier: '5x_trial',
    title: '5x Plan 1 Week Trial',
    badge: '1 Week Trial',
    priceInr: '₹1,300',
    duration: '7 days',
    features: [
      '5× the usage of official Claude Pro',
      'All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku',
      '7 days of access',
      'Vision, web search and extended thinking',
      'Full SSE streaming & built-in tools',
      'Works with Claude Code, Cursor, VS Code, Windsurf'
    ]
  }
];

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onKeyAcquired,
}) => {
  const [selectedTier, setSelectedTier] = useState<PlanTier>('20x');
  const [order, setOrder] = useState<any>(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedKey, setIssuedKey] = useState<ApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  if (!isOpen) return null;

  const currentPlan = MODAL_PLANS.find(p => p.tier === selectedTier) || MODAL_PLANS[0];
  const whatsappUrl = getWhatsAppSupportUrl(`Hi Admin! I want to subscribe to the ${currentPlan.title} (${currentPlan.priceInr} INR).`);

  const handleSelectTier = async (tier: PlanTier) => {
    setSelectedTier(tier);
    setLoading(true);
    setError('');
    try {
      const newOrder = await createCryptoOrder(tier);
      setOrder(newOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantFreeDevKey = async () => {
    setLoading(true);
    setError('');
    try {
      const key = await generateKey(`Instant Dev Key (${selectedTier})`, selectedTier);
      setIssuedKey(key);
      if (onKeyAcquired) onKeyAcquired(key);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to issue instant key');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyCryptoOrder(
        order?.orderId || `ord_${Date.now()}`,
        selectedTier,
        txHash || `0x${Math.random().toString(16).substr(2, 32)}`
      );

      const generated: ApiKey = {
        id: String(Date.now()),
        name: `${selectedTier.toUpperCase()} Pro Key`,
        key_prefix: `opm-live-${selectedTier}`,
        key_token: res.apiKey,
        tier: selectedTier,
        status: 'active',
        rate_limit_rpm: selectedTier === '20x' ? 120 : 60,
        rate_limit_tpm: selectedTier === '20x' ? 1000000 : 400000,
        window_token_limit: selectedTier === '20x' ? 100000000 : 25000000,
        window_tokens_used: 0,
        window_started_at: new Date().toISOString(),
        window_resets_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        total_tokens_consumed: 0,
        total_requests: 0,
        created_at: new Date().toISOString(),
      };

      setIssuedKey(generated);
      if (onKeyAcquired) onKeyAcquired(generated);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyKey = async () => {
    if (issuedKey) {
      const success = await copyToClipboard(issuedKey.key_token);
      if (success) {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    }
  };

  const handleCopyAddr = async () => {
    if (order?.depositAddress) {
      const success = await copyToClipboard(order.depositAddress);
      if (success) {
        setCopiedAddr(true);
        setTimeout(() => setCopiedAddr(false), 2000);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        className="dark-box relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#262320] bg-[#0F0E0D] shadow-2xl max-h-[92vh] flex flex-col text-[#F5F2EB]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262320] px-6 py-4 bg-[#141312]">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Opuszyra Logo"
              width="44"
              height="44"
              className="h-11 w-11 object-contain drop-shadow-[0_2px_8px_rgba(234,88,12,0.3)]"
            />
            <div>
              <h2 id="pricing-modal-title" className="text-lg font-bold text-white">Opuszyra Plans &amp; Activation</h2>
              <p className="text-xs text-stone-400">Instant API keys · UPI (INR) &amp; WhatsApp Onboarding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close pricing modal"
            className="rounded-xl p-2 text-stone-400 hover:bg-white/5 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {issuedKey ? (
            /* Key Success View */
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Your Key is Ready!</h3>
                <p className="mt-2 text-sm text-stone-400">
                  Your <strong className="text-[#EA580C]">{selectedTier.toUpperCase()} Key</strong> is active with full Anthropic compatibility.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-[#141312] p-4 text-left font-mono">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                  <span>API TOKEN</span>
                  <span className="text-emerald-400 font-bold">● ACTIVE</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-black/50 border border-white/5 p-3">
                  <span className="text-sm text-amber-300 break-all select-all font-bold">
                    {issuedKey.key_token}
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 transition shadow"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setIssuedKey(null);
                    setOrder(null);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-stone-300 hover:bg-white/5"
                >
                  Issue Another Key
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-[#EA580C] hover:bg-[#D94E0A] px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/30"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 3 Tier Selection Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                {MODAL_PLANS.map((plan) => {
                  const isSelected = selectedTier === plan.tier;
                  return (
                    <div
                      key={plan.tier}
                      onClick={() => handleSelectTier(plan.tier)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#EA580C] bg-orange-500/10 shadow-lg shadow-orange-600/15 ring-1 ring-[#EA580C]'
                          : 'border-[#262320] bg-[#141312] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-stone-300 uppercase tracking-wider">
                            {plan.badge}
                          </span>
                          <span className="text-xs text-stone-400">{plan.duration}</span>
                        </div>
                        <h4 className="text-lg font-extrabold text-white">{plan.title}</h4>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white">{plan.priceInr}</span>
                          <span className="text-xs text-stone-400">INR</span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5 stroke-[2.5]" />
                            <span className="line-clamp-2">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Instant WhatsApp Help & Checkout */}
              {whatsappUrl && (
                <div className="rounded-2xl bg-[#141312] border border-[#262320] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Instant UPI &amp; WhatsApp Key Delivery</h5>
                      <p className="text-[11px] text-stone-400">
                        Connect directly with Admin for GPay / PhonePe / Paytm / Cards payment and instantaneous activation.
                      </p>
                    </div>
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Contact on WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Developer Test Mode Key Generation */}
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
                <p className="text-xs text-stone-400 mb-2">
                  Need to evaluate in Cursor / Claude Code immediately?
                </p>
                <button
                  onClick={handleInstantFreeDevKey}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Issue Instant Test Key for {currentPlan.title}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
