import React from 'react';
import { Check, Sparkles, Zap, Shield, Cpu, ExternalLink } from 'lucide-react';

const MODELS_DATA = [
  {
    name: 'Claude 3.7 Sonnet',
    id: 'claude-3-7-sonnet-20250219',
    badge: 'Latest & Recommended',
    context: '200K tokens',
    speed: 'High (SSE unbuffered)',
    reasoning: 'Hybrid Think & Direct',
    vision: true,
    caching: true,
    tools: true,
    bestFor: 'Complex multi-file refactoring, autonomous coding agents, system design',
  },
  {
    name: 'Claude 3.5 Sonnet v2',
    id: 'claude-3-5-sonnet-20241022',
    badge: 'Production Workhorse',
    context: '200K tokens',
    speed: 'Very Fast',
    reasoning: 'Standard Chain-of-Thought',
    vision: true,
    caching: true,
    tools: true,
    bestFor: 'Day-to-day coding, Cursor rules, fast code completions, document analysis',
  },
  {
    name: 'Claude 3 Opus',
    id: 'claude-3-opus-20240229',
    badge: 'Deep Architecture',
    context: '200K tokens',
    speed: 'Deliberate',
    reasoning: 'Deep Analytical',
    vision: true,
    caching: true,
    tools: true,
    bestFor: 'Nuanced legal/financial analysis, massive architecture synthesis',
  },
  {
    name: 'Claude 3.5 Haiku',
    id: 'claude-3-5-haiku-20241022',
    badge: 'Ultra Fast',
    context: '200K tokens',
    speed: 'Lightning (~150 tok/s)',
    reasoning: 'Rapid inference',
    vision: true,
    caching: true,
    tools: true,
    bestFor: 'Real-time autocompletion, high-volume classification, batch extraction',
  },
  {
    name: 'Claude Fable 5.1',
    id: 'claude-fable-5-1',
    badge: 'Experimental',
    context: '256K tokens',
    speed: 'Dynamic',
    reasoning: 'Creative & Code Hybrid',
    vision: true,
    caching: true,
    tools: true,
    bestFor: 'Exploratory engineering prompts, edge case evaluations',
  },
];

export const ModelsMatrix: React.FC = () => {
  return (
    <div id="models" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full Anthropic Model Lineup</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Every Claude Model. <span className="text-gradient-orange">Zero Tier Gating</span>.
        </h2>
        <p className="text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
          Both 5× and 20× Opuszyra plans unlock the complete Claude family on a per-request basis with identical low latency.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-dark-900/80 backdrop-blur-xl shadow-2xl">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-dark-950/80 font-mono text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-4 px-6">Model</th>
              <th className="py-4 px-4">Context Window</th>
              <th className="py-4 px-4">Reasoning Engine</th>
              <th className="py-4 px-4 text-center">Vision</th>
              <th className="py-4 px-4 text-center">Free Cache</th>
              <th className="py-4 px-4">Best For</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {MODELS_DATA.map((m) => (
              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold text-white font-mono text-sm">{m.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{m.id}</div>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {m.badge}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-slate-300">{m.context}</td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.04] text-slate-300 font-mono text-xs border border-white/5">
                    {m.reasoning}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center">
                    <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center">
                    <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-400 text-xs max-w-xs">{m.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
