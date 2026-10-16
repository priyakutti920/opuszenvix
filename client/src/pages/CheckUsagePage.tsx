import React, { useState } from 'react';
import { KeyInspector } from '../components/KeyInspector';
import { 
  Key, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface CheckUsagePageProps {
  onOpenPricing?: () => void;
  initialKey?: string;
}

export const CheckUsagePage: React.FC<CheckUsagePageProps> = ({ 
  onOpenPricing,
  initialKey 
}) => {
  return (
    <div className="min-h-screen py-12 md:py-20 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">
            <Key className="w-3.5 h-3.5" />
            <span>Anonymous • Real-Time • 5-Hour Rolling Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Check API Usage &amp; Limits
          </h1>
          <p className="text-base text-slate-400 mt-3 leading-relaxed">
            Inspect your active Opuszyra key status, remaining token balance in the current 5-hour rolling window, TPM/RPM limits, and exact countdown to the next quota refresh.
          </p>
        </div>

        {/* Embedded Full Key Inspector */}
        <div className="mb-14">
          <KeyInspector initialKey={initialKey || ''} isModal={false} />
        </div>

        {/* Information Grid: How the 5-Hour Cycle Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/10 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">5-Hour Rolling Window</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quota operates on a rolling 5-hour window. Token usage older than 5 hours is automatically released back to your available balance without needing manual top-ups.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/10 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Free Prompt Caching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cached prompt reads consume 0 tokens from your allowance. High-context codebase work in Claude Code or Cursor runs at maximum efficiency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/10 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Log Retention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never log or store request prompts, source code, or completion payloads. Only aggregate token metrics are tracked for rolling window replenishment.
            </p>
          </div>
        </div>

        {/* Need more capacity CTA */}
        {onOpenPricing && (
          <div className="rounded-2xl border border-white/10 bg-dark-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl">
            <div>
              <h4 className="text-lg font-bold text-white">Need higher throughput or more agent capacity?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Upgrade to the 20× Autonomous Agent tier for 100M tokens per window and 1,000,000 TPM.
              </p>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold font-mono text-xs sm:text-sm tracking-wide shrink-0 flex items-center gap-2 shadow-lg shadow-brand-500/20 transition"
            >
              <span>Explore Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
