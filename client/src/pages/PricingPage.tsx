import React, { useState } from 'react';
import { 
  Check, 
  Minus,
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Cpu, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  MessageCircle,
  Copy,
  Terminal,
  Server,
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PlanTier } from '../types';

interface PricingPageProps {
  onSelectPlan: (tier: PlanTier) => void;
  onOpenCheckKey?: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does the 5-hour rolling window work?",
    a: "Unlike official Anthropic or Claude Pro which enforces strict 24-hour cliff cutoffs, Opuszyra continuously replenishes your token allowance on a 5-hour rolling schedule. If you burn through a burst of tokens running autonomous agents, your quota begins recovering in 5 hours instead of waiting until midnight tomorrow."
  },
  {
    q: "How do I pay with UPI, Indian Cards, or USDT?",
    a: "Click 'Get this plan →' on any plan. You can pay via UPI (GPay, PhonePe, Paytm, BHIM), NetBanking/Cards in INR, or USDT (TRC-20). You can also click 'Contact Admin on WhatsApp' for instant human onboarding and manual key delivery."
  },
  {
    q: "Are prompt cache reads really 100% free?",
    a: "Yes! When you enable prompt caching with Claude 3.5 or Claude 3.7 using cache_control: {type: 'ephemeral'}, all cached token reads are zero-rated against your allowance. This reduces effective token burn by 70-90% for large codebase contexts in Cursor and Claude Code."
  },
  {
    q: "Can I share my key across multiple tools or machines?",
    a: "Absolutely. You can use your Opuszyra key simultaneously in Cursor, Claude Code CLI, Cline, Roo Code, Python scripts, and CI/CD pipelines as long as your concurrent usage stays within your plan's RPM and TPM limits."
  },
  {
    q: "What models are supported?",
    a: "All 13 standard Anthropic models: Claude 3.7 Sonnet (Hybrid thinking), Claude 3.5 Sonnet (v2), Claude 3.5 Haiku, Claude 3 Opus, and previous iterations. Request any model by its standard Anthropic model ID."
  }
];

const COMPARISON_ROWS = [
  {
    feature: "Quota Reset Cycle",
    opus: "5-Hour Rolling Window (Auto-replenishing)",
    pro: "24-Hour Strict Cliff Lockout",
    direct: "Pay-Per-Token (Surprise bills)"
  },
  {
    feature: "Prompt Caching Reads",
    opus: "100% Free (Zero Token Burn)",
    pro: "Not Supported",
    direct: "Paid ($1.50 per 1M tokens)"
  },
  {
    feature: "Model Lineup",
    opus: "All 13 Models (Claude 3.7 Hybrid, Sonnet, Opus)",
    pro: "Limited Web Models Only",
    direct: "Requires Tier Approvals"
  },
  {
    feature: "Tool Compatibility",
    opus: "Native Cursor, Claude Code CLI, Windsurf, Cline",
    pro: "Browser & Mobile App Only",
    direct: "Manual SDK Coding Required"
  },
  {
    feature: "Payment Flexibility",
    opus: "UPI, GPay, PhonePe, Cards (INR) + USDT",
    pro: "USD Credit Card Only",
    direct: "USD Pre-charge / Invoicing"
  },
  {
    feature: "Throughput / Concurrency",
    opus: "Up to 120 RPM / 1M TPM Burst",
    pro: "Heavily Throttled in Peak Hours",
    direct: "Rate-limited by Spend Tier"
  }
];

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, onOpenCheckKey }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [copiedCode, setCopiedCode] = useState(false);

  const whatsappUrl = "https://wa.me/918098830937?text=Hi%20Admin!%20I%20want%20to%20subscribe%20to%20an%20Opuszyra%20API%20plan.";

  const handleCopyConfig = () => {
    navigator.clipboard.writeText('export ANTHROPIC_BASE_URL=https://api.opuszyra.live/v1\nexport ANTHROPIC_API_KEY=opm-live-your_key_here');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen py-10 md:py-16 animate-fadeIn transition-colors text-stone-900 dark:text-[#F5F2EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#EA580C] dark:text-orange-400 text-xs font-mono mb-4">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Instant Key Activation • 5-Hour Rolling Reset</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight">
            High-Multiplier Plans. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400">Zero Lockouts</span>.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            Choose the capacity multiplier calibrated for your workflow. From everyday coding to 24/7 autonomous agent swarms with 100% free prompt caching reads.
          </p>

          {/* Currency Toggle */}
          <div className="mt-7 inline-flex items-center p-1 rounded-full bg-stone-200/80 dark:bg-[#181716] border border-stone-300 dark:border-[#2B2724] shadow-inner">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                currency === 'INR'
                  ? 'bg-white dark:bg-[#EA580C] text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              ₹ INR (Rupees)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                currency === 'USD'
                  ? 'bg-white dark:bg-[#EA580C] text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              $ USD / USDT
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 items-stretch">
          
          {/* CARD 1: 5x Plan */}
          <div className="rounded-3xl p-7 relative transition-all duration-200 flex flex-col justify-between bg-[#FDFCFB] dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] text-[#1C1917] dark:text-[#F5F2EB] shadow-sm hover:shadow-md">
            <div>
              <h3 className="text-xl font-extrabold mb-2 text-[#1C1917] dark:text-white">5x Plan</h3>
              <p className="text-xs leading-relaxed mb-6 text-[#78716C] dark:text-[#A8A29E]">
                The everyday plan. Matches Claude Max 5× at a fraction of the price.
              </p>
              
              <div className="mb-2 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl font-black tracking-tight text-[#1C1917] dark:text-white">
                  {currency === 'INR' ? '₹4,999' : '$59'}
                </span>
                <span className="text-xs font-semibold uppercase text-[#78716C] dark:text-[#A8A29E]">
                  {currency === 'INR' ? 'INR' : 'USD'} / month
                </span>
              </div>

              <div className="mt-4 mb-2">
                <button
                  type="button"
                  onClick={() => onSelectPlan('5x')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#F4F0E8] dark:bg-white/10 hover:bg-[#EBE5DA] dark:hover:bg-white/15 text-[#1C1917] dark:text-white border border-[#E2DDD3] dark:border-white/15 active:scale-[0.99]"
                >
                  <span>Get this plan →</span>
                </button>
                <p className="text-[11px] text-center mt-2 font-medium text-[#A8A29E]">
                  Instant key delivery after payment
                </p>
              </div>

              <hr className="my-6 border-t border-[#E8E3D9] dark:border-[#262422]" />

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-4 text-[#78716C] dark:text-[#A8A29E]">
                  INCLUDES
                </p>
                <ul className="space-y-3">
                  {[
                    "Includes",
                    "All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku",
                    "5× the usage of official Claude Pro",
                    "30 days of access",
                    "Vision, web search and extended thinking",
                    "Full SSE streaming",
                    "Built-in tools — nothing to install",
                    "Works with Claude Code, Cursor, VS Code, Windsurf"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-[#44403C] dark:text-[#D6D3D1]">
                      <Check className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0 stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 2: 20x Plan (Featured) */}
          <div className="dark-box rounded-3xl p-7 relative transition-all duration-200 flex flex-col justify-between bg-[#0F0E0D] border-2 border-[#262320] text-[#F5F2EB] shadow-2xl ring-1 ring-orange-500/20 lg:-translate-y-2">
            {/* Popular Pill */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-widest shadow-md">
              Most Popular
            </div>

            <div>
              <h3 className="text-xl font-extrabold mb-2 text-white">20x Plan</h3>
              <p className="text-xs leading-relaxed mb-6 text-[#A8A29E]">
                For agentic workloads that run all day. Matches Claude Max 20×.
              </p>

              <div className="mb-2 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl font-black tracking-tight text-white">
                  {currency === 'INR' ? '₹6,999' : '$84'}
                </span>
                <span className="text-xs font-semibold uppercase text-[#A8A29E]">
                  {currency === 'INR' ? 'INR' : 'USD'} / month
                </span>
              </div>

              <div className="mt-4 mb-2">
                <button
                  type="button"
                  onClick={() => onSelectPlan('20x')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#EA580C] hover:bg-[#D94E0A] text-white shadow-lg shadow-orange-600/25 active:scale-[0.99]"
                >
                  <span>Get this plan →</span>
                </button>
                <p className="text-[11px] text-center mt-2 font-medium text-[#78716C]">
                  Instant key delivery after payment
                </p>
              </div>

              <hr className="my-6 border-t border-[#262320]" />

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-4 text-[#A8A29E]">
                  INCLUDES
                </p>
                <ul className="space-y-3">
                  {[
                    "Includes",
                    "All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku",
                    "20× the usage of official Claude Pro",
                    "Rolling 5-hour window — resets itself",
                    "Vision, web search and extended thinking",
                    "Full SSE streaming",
                    "Built-in tools — nothing to install",
                    "Anthropic SDK compatible",
                    "Real-time usage dashboard",
                    "API key management",
                    "Priority support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-[#D6D3D1]">
                      <Check className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0 stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 3: 5x Plan 1 Week Trial */}
          <div className="rounded-3xl p-7 relative transition-all duration-200 flex flex-col justify-between bg-[#FDFCFB] dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] text-[#1C1917] dark:text-[#F5F2EB] shadow-sm hover:shadow-md">
            <div>
              <h3 className="text-xl font-extrabold mb-2 text-[#1C1917] dark:text-white">5x Plan 1 Week Trial</h3>
              <p className="text-xs leading-relaxed mb-6 text-[#78716C] dark:text-[#A8A29E]">
                The everyday plan. Matches Claude Max 5× at a fraction of the price.
              </p>

              <div className="mb-2 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl font-black tracking-tight text-[#1C1917] dark:text-white">
                  {currency === 'INR' ? '₹1,300' : '$15'}
                </span>
                <span className="text-xs font-semibold uppercase text-[#78716C] dark:text-[#A8A29E]">
                  {currency === 'INR' ? 'INR' : 'USD'} / 1 week
                </span>
              </div>

              <div className="mt-4 mb-2">
                <button
                  type="button"
                  onClick={() => onSelectPlan('5x_trial')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#F4F0E8] dark:bg-white/10 hover:bg-[#EBE5DA] dark:hover:bg-white/15 text-[#1C1917] dark:text-white border border-[#E2DDD3] dark:border-white/15 active:scale-[0.99]"
                >
                  <span>Get this plan →</span>
                </button>
                <p className="text-[11px] text-center mt-2 font-medium text-[#A8A29E]">
                  Instant key delivery after payment
                </p>
              </div>

              <hr className="my-6 border-t border-[#E8E3D9] dark:border-[#262422]" />

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-4 text-[#78716C] dark:text-[#A8A29E]">
                  INCLUDES
                </p>
                <ul className="space-y-3">
                  {[
                    "Includes",
                    "All 13 models — Fable 5, Sonnet 5, Opus, Sonnet, Haiku",
                    "5× the usage of official Claude Pro",
                    "7 days of access",
                    "Vision, web search and extended thinking",
                    "Full SSE streaming",
                    "Built-in tools — nothing to install",
                    "Works with Claude Code, Cursor, VS Code, Windsurf"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-[#44403C] dark:text-[#D6D3D1]">
                      <Check className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0 stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="text-center py-4 px-6 rounded-2xl bg-[#F4EFEC] dark:bg-[#1A1918] border border-[#E8E3D9] dark:border-[#2B2724] max-w-3xl mx-auto mb-20 shadow-sm">
          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium flex items-center justify-center gap-1.5 flex-wrap">
            <CreditCard className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>Paid in INR (UPI / GPay / PhonePe / Cards).</span>
            <span>Pay online directly or</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EA580C] hover:underline font-bold inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>Contact Admin on WhatsApp</span>
            </a>
            <span>for instant key delivery.</span>
          </p>
        </div>

        {/* ========================================================
            REPLACED MODULE: ARCHITECTURAL COMPARISON & CAPABILITY MATRIX
            Clean, attractive theme with high-converting comparison points
            ======================================================== */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-[#EA580C] text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architectural Advantage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Why Engineers Switch to Opuszyra
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              Continuous rolling throughput, zero cliff lockouts, and 100% free prompt caching reads.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#121110] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E3D9] dark:border-[#262422] bg-[#F4F0E8] dark:bg-[#1A1918]">
                    <th className="py-4 px-6 font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                      Capability
                    </th>
                    <th className="py-4 px-6 font-black text-[#EA580C] uppercase tracking-wider text-[11px] bg-orange-500/5">
                      Opuszyra Gateway ⚡
                    </th>
                    <th className="py-4 px-6 font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[11px]">
                      Claude Pro ($20/mo)
                    </th>
                    <th className="py-4 px-6 font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[11px]">
                      Direct Anthropic API
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E3D9] dark:divide-[#262422]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-bold text-stone-800 dark:text-white whitespace-nowrap">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-[#EA580C] bg-orange-500/[0.03]">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                          <span>{row.opus}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-stone-500 dark:text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Minus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{row.pro}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-stone-500 dark:text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Minus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{row.direct}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================
            3-STEP ACTIVATION FLOW WITH COPYABLE TERMINAL SNIPPET
            ======================================================== */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Get Started in 30 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Zero complicated configurations. Works with any tool that supports Anthropic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-3xl bg-[#FDFCFB] dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] relative">
              <span className="text-3xl font-black text-[#EA580C] opacity-40 block mb-2">01</span>
              <h3 className="text-base font-bold mb-1">Select &amp; Pay</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Choose your capacity tier. Pay seamlessly with UPI (GPay/PhonePe), Card, or USDT TRC-20.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FDFCFB] dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] relative">
              <span className="text-3xl font-black text-[#EA580C] opacity-40 block mb-2">02</span>
              <h3 className="text-base font-bold mb-1">Instant Key Delivery</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Your key is generated automatically in 10 seconds and ready for terminal or IDE paste.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FDFCFB] dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] relative">
              <span className="text-3xl font-black text-[#EA580C] opacity-40 block mb-2">03</span>
              <h3 className="text-base font-bold mb-1">Code Without Limits</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Set the base URL in Cursor, Claude Code, or Windsurf and enjoy uninterrupted agent swarms.
              </p>
            </div>
          </div>

          {/* Copyable Terminal Snippet Box */}
          <div className="dark-code-box rounded-3xl bg-[#0F0E0D] border border-[#262320] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <Terminal className="w-4 h-4 text-[#EA580C]" />
                <span>Cursor &amp; Claude Code CLI Setup</span>
              </div>
              <button
                onClick={handleCopyConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-all font-mono"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Config'}</span>
              </button>
            </div>

            <div className="font-mono text-xs text-amber-300 space-y-1 overflow-x-auto py-1">
              <p><span className="text-stone-500"># Point Anthropic clients to Opuszyra Gateway</span></p>
              <p className="text-emerald-400">export ANTHROPIC_BASE_URL="https://api.opuszyra.live/v1"</p>
              <p className="text-emerald-400">export ANTHROPIC_API_KEY="opm-live-your_key_here"</p>
              <p><span className="text-stone-500"># Run Claude Code CLI immediately with 5x / 20x capacity</span></p>
              <p className="text-white">claude --model claude-3-7-sonnet-20250219</p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Everything you need to know about keys, billing, and rolling windows.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#EA580C] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Floating WhatsApp Widget Button */}
      <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative group"
          aria-label="Open WhatsApp chat with Admin"
          title="Contact Admin on WhatsApp"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400/35 animate-ping opacity-75 group-hover:animate-none" />
          <MessageCircle className="w-7 h-7 fill-current relative z-10" />
        </a>
      </div>
    </div>
  );
};
