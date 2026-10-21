import React from 'react';
import { KeyInspector } from '../components/KeyInspector';
import { 
  Key, 
  Clock, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface CheckUsagePageProps {
  onOpenPricing?: () => void;
  initialKey?: string;
}

export const CheckUsagePage: React.FC<CheckUsagePageProps> = ({ 
  initialKey 
}) => {
  return (
    <div className="min-h-screen py-12 md:py-20 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-mono uppercase tracking-wider font-bold mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
            <span>DIAGNOSTIC TELEMETRY • REAL-TIME API SYNC</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 dark:text-white tracking-tight">
            Key Status &amp; <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Usage</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-3 leading-relaxed max-w-2xl mx-auto">
            Real-time token quota telemetry, sliding 5-hour rolling windows, and multi-modal gateway metrics queried live via API.
          </p>
        </div>

        {/* Embedded Full Key Inspector */}
        <div className="mb-14">
          <KeyInspector initialKey={initialKey || ''} isModal={false} />
        </div>

        {/* Information Grid: How the 5-Hour Cycle Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">5-Hour Rolling Window</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Quota operates on a rolling 5-hour window. Token usage older than 5 hours is automatically released back to your available balance without needing manual top-ups.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Free Prompt Caching</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cached prompt reads consume 0 tokens from your allowance. High-context codebase work in Claude Code or Cursor runs at maximum efficiency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Zero Log Retention</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We never log or store request prompts, source code, or completion payloads. Only aggregate token metrics are tracked for rolling window replenishment.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
