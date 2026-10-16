import React, { useState } from 'react';
import { X, Check, Copy, QrCode, ShieldCheck, Zap, ArrowRight, RotateCw, Sparkles, CheckCircle2, CreditCard, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createCryptoOrder, verifyCryptoOrder } from '../lib/api';
import { PlanTier } from '../types';

interface CheckoutModalProps {
  tier: PlanTier;
  isOpen?: boolean;
  onClose: () => void;
  onKeyCreated: (newKey: any) => void;
}

const PLAN_META: Record<PlanTier, { name: string; priceInr: number; priceUsdt: number; duration: string }> = {
  '5x': { name: '5x Plan', priceInr: 4999, priceUsdt: 30, duration: '30 days' },
  '20x': { name: '20x Plan', priceInr: 6999, priceUsdt: 50, duration: '30 days' },
  '5x_trial': { name: '5x Plan 1 Week Trial', priceInr: 1300, priceUsdt: 15, duration: '7 days' },
  'custom': { name: 'Custom Enterprise', priceInr: 9999, priceUsdt: 100, duration: 'Custom' },
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ tier, isOpen = true, onClose, onKeyCreated }) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'usdt'>('upi');
  const [step, setStep] = useState<'pay' | 'verifying' | 'success'>('pay');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [txHash, setTxHash] = useState('');

  const plan = PLAN_META[tier] || PLAN_META['5x'];
  const depositAddress = 'TJ8yQp3s9W8f2NmK1L9x7P4v6B3c8D1e0Z';
  const upiId = 'opuszen@ybl';
  const whatsappUrl = `https://wa.me/918098830937?text=Hi%20Admin!%20I%20want%20to%20subscribe%20to%20the%20${encodeURIComponent(plan.name)}%20(₹${plan.priceInr}%20INR).`;

  const handleCopyAddr = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setStep('verifying');
    try {
      setTimeout(async () => {
        try {
          const res = await verifyCryptoOrder(
            `ord_${Date.now()}`,
            tier,
            txHash || `0x${Math.random().toString(16).substr(2, 32)}`
          );

          setGeneratedKey(res.apiKey);
          setStep('success');

          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ea580c', '#fbbf24', '#38bdf8', '#10b981'],
          });

          onKeyCreated({
            key_token: res.apiKey,
            tier,
          });
        } catch {
          setStep('pay');
        }
      }, 1600);
    } catch {
      setStep('pay');
    }
  };

  const handleCopyGeneratedKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="dark-box relative w-full max-w-lg rounded-3xl bg-[#0f0e0d] border border-[#262320] shadow-2xl p-6 sm:p-8 overflow-hidden text-[#f5f2eb]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'pay' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-[#ea580c]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  Activate <span className="text-[#ea580c]">{plan.name}</span>
                </h3>
                <p className="text-xs text-stone-400">Instant key delivery after payment • {plan.duration}</p>
              </div>
            </div>

            {/* Price banner */}
            <div className="p-4 rounded-2xl bg-[#161514] border border-[#2b2724] mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold block tracking-wider">Amount Due</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">₹{plan.priceInr.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-stone-400">INR</span>
                  <span className="text-xs text-stone-500 font-mono">(${plan.priceUsdt} USDT)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-400 uppercase font-semibold block tracking-wider">Validity</span>
                <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 inline-block">
                  {plan.duration}
                </span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1918] rounded-xl border border-[#2b2724] mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-[#ea580c] text-white shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>UPI / Cards (INR)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('usdt')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'usdt'
                    ? 'bg-[#ea580c] text-white shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>USDT (TRC-20)</span>
              </button>
            </div>

            {paymentMethod === 'upi' ? (
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-400">
                    UPI ID (GPay / PhonePe / Paytm / BHIM):
                  </label>
                  <div className="p-3 rounded-xl bg-[#141312] border border-[#2b2724] flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-white truncate">{upiId}</code>
                    <button
                      onClick={handleCopyUpi}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-stone-300 hover:text-white transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1a1918] border border-[#2b2724] text-xs text-stone-300 space-y-2">
                  <div className="flex items-center gap-2 text-stone-200 font-semibold">
                    <span>⚡ Quick WhatsApp Activation:</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Pay ₹{plan.priceInr.toLocaleString('en-IN')} via any UPI app or card, and connect directly with Admin for priority instantaneous key provisioning.
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all w-full justify-center shadow-md shadow-emerald-900/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact Admin on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-400">
                    USDT TRC-20 Deposit Address:
                  </label>
                  <div className="p-3 rounded-xl bg-[#141312] border border-[#2b2724] flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-orange-400 truncate">{depositAddress}</code>
                    <button
                      onClick={handleCopyAddr}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-stone-300 hover:text-white transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-stone-400">
                    Transaction Hash / TxID (Optional):
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="e.g. 5a4b3c2d1e0f..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141312] border border-[#2b2724] focus:border-orange-500/50 text-stone-200 font-mono text-xs outline-none"
                  />
                </div>
              </div>
            )}

            {/* Instant Verification CTA */}
            <button
              onClick={handleSimulatePayment}
              className="w-full py-3.5 rounded-xl bg-[#ea580c] hover:bg-[#d94e0a] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Payment &amp; Issue API Key</span>
            </button>

            <p className="text-[11px] text-stone-500 text-center mt-3">
              Instant automated key delivery upon verification.
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="py-12 text-center space-y-4">
            <RotateCw className="w-12 h-12 text-[#ea580c] animate-spin mx-auto" />
            <h3 className="text-lg font-bold font-mono text-white">Verifying Transaction...</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Connecting with payment gateway node confirmations and provisioning your {plan.name} allowance.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                Payment Confirmed!
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Your <strong className="text-[#ea580c]">{plan.name}</strong> is now live with full Anthropic compatibility.
              </p>
            </div>

            {/* Key Presentation Box */}
            <div className="p-4 rounded-2xl bg-[#141312] border border-emerald-500/30 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>YOUR OPUSZEN API KEY</span>
                <span className="text-emerald-400 font-bold">Status: Active</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a0a09] border border-white/5 font-mono text-xs text-amber-300 break-all select-all">
                {generatedKey}
              </div>
              <button
                onClick={handleCopyGeneratedKey}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy API Key'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-stone-400 text-left font-mono">
              💡 Setup in Claude Code: <code className="text-orange-400">export ANTHROPIC_BASE_URL=https://api.opuszen.shop/v1</code>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs transition-colors"
            >
              Done &amp; Start Building
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
