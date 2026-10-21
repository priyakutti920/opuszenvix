import React from 'react';
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
  CreditCard,
  MessageCircle,
  Server,
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PlanTier } from '../types';
import { getWhatsAppSupportUrl } from '../lib/support';

interface PricingPageProps {
  onSelectPlan: (tier: PlanTier) => void;
  onOpenCheckKey?: () => void;
}

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
    opus: "UPI, GPay, PhonePe, Cards (INR)",
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
  const whatsappUrl = getWhatsAppSupportUrl("Hi Admin! I want to subscribe to an Opuszenvix API plan.");

  return (
    <div className="min-h-screen py-10 md:py-16 pb-28 animate-fadeIn transition-colors text-stone-900 dark:text-[#F5F2EB]">
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

          {/* INR Badge */}
          <div className="mt-7 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#EA580C] text-xs font-bold font-mono">
            <span>₹ INR Pricing • Pay via UPI (GPay / PhonePe / Paytm / BHIM) &amp; Cards</span>
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
                  ₹4,999
                </span>
                <span className="text-xs font-semibold uppercase text-[#78716C] dark:text-[#A8A29E]">
                  INR / month
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
          <div className="dark-box rounded-3xl p-7 relative transition-all duration-200 flex flex-col justify-between bg-white dark:bg-[#0F0E0D] border-2 border-[#EA580C] text-[#1C1917] dark:text-[#F5F2EB] shadow-xl ring-2 ring-orange-500/20 lg:-translate-y-2">
            {/* Popular Pill */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-widest shadow-md">
              Most Popular
            </div>

            <div>
              <h3 className="text-xl font-extrabold mb-2 text-[#1C1917] dark:text-white">20x Plan</h3>
              <p className="text-xs leading-relaxed mb-6 text-[#78716C] dark:text-[#A8A29E]">
                For agentic workloads that run all day. Matches Claude Max 20×.
              </p>

              <div className="mb-2 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl font-black tracking-tight text-[#1C1917] dark:text-white">
                  ₹6,999
                </span>
                <span className="text-xs font-semibold uppercase text-[#78716C] dark:text-[#A8A29E]">
                  INR / month
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
                <p className="text-[11px] text-center mt-2 font-medium text-[#78716C] dark:text-[#A8A29E]">
                  Instant key delivery after payment
                </p>
              </div>

              <hr className="my-6 border-t border-[#E8E3D9] dark:border-[#262320]" />

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-4 text-[#78716C] dark:text-[#A8A29E]">
                  INCLUDES
                </p>
                <ul className="space-y-3">
                  {[
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
                    <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-[#44403C] dark:text-[#D6D3D1]">
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
                  ₹1,300
                </span>
                <span className="text-xs font-semibold uppercase text-[#78716C] dark:text-[#A8A29E]">
                  INR / 1 week
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
            {whatsappUrl ? (
              <>
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
              </>
            ) : (
              <span>Pay online directly for immediate key activation.</span>
            )}
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
              Why Engineers Switch to Opuszenvix
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              Continuous rolling throughput, zero cliff lockouts, and 100% free prompt caching reads.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#121110] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#E8E3D9] dark:border-[#262422] bg-[#F4F0E8] dark:bg-[#1A1918]">
                    <th className="py-4 px-6 font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                      Capability
                    </th>
                    <th className="py-4 px-6 font-black text-[#EA580C] uppercase tracking-wider text-[11px] bg-orange-500/5">
                      Opuszenvix Gateway ⚡
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

      </div>

      {/* Floating WhatsApp Widget Button */}
      {whatsappUrl && (
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
      )}
    </div>
  );
};
