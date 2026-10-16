import React, { useState } from 'react';
import { Check, Zap, Sparkles, ShieldCheck, ArrowRight, Clock, Cpu, CreditCard, MessageCircle } from 'lucide-react';
import { PlanTier } from '../types';

interface PricingProps {
  onSelectPlan: (tier: PlanTier) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const whatsappUrl = "https://wa.me/918098830937?text=Hi%20Admin!%20I%20want%20to%20subscribe%20to%20an%20Opuszyra%20API%20plan.";

  return (
    <div id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#EA580C] text-xs font-mono mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Transparent AI API Pricing • Zero Hidden Fees</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          High-Multiplier Plans. <span className="text-[#EA580C]">Instant Key Delivery</span>.
        </h2>
        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mt-4 leading-relaxed">
          Never wait 24 hours again. Enjoy rolling 5-hour window replenishment, full SSE streaming, and 100% free prompt caching reads.
        </p>

        {/* Currency Switcher */}
        <div className="mt-6 inline-flex items-center p-1 rounded-full bg-stone-200/80 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 shadow-inner">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              currency === 'INR'
                ? 'bg-white dark:bg-[#ea580c] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ₹ INR (Rupees)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              currency === 'USD'
                ? 'bg-white dark:bg-[#ea580c] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            $ USD / USDT
          </button>
        </div>
      </div>

      {/* 3 Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 items-stretch max-w-6xl mx-auto">
        
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

      {/* Bottom WhatsApp / INR Banner */}
      <div className="text-center py-4 px-6 rounded-2xl bg-[#F4EFEC] dark:bg-[#1A1918] border border-[#E8E3D9] dark:border-[#2B2724] max-w-3xl mx-auto shadow-sm">
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

    </div>
  );
};
