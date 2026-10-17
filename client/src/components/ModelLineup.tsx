import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTitle } from './AnimatedTitle';
import { copyToClipboard } from '../lib/clipboard';

interface ModelInfo {
  name: string;
  id: string;
  context: string;
  badge?: string;
  description: string;
  cutoff: string;
  tier: 'flagship' | 'standard';
}

const FLAGSHIP_MODELS: ModelInfo[] = [
  {
    name: 'Claude Fable 5.1',
    id: 'claude-fable-5-1',
    context: '1M context',
    badge: 'New',
    description:
      'The most capable model in the lineup, for demanding reasoning and long-horizon agentic work. Its knowledge runs to June 2026 — the most recent of any model here.',
    cutoff: 'June 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude Fable 5',
    id: 'claude-fable-5',
    context: '1M context',
    description:
      'The previous Fable generation. Frontier reasoning and long-horizon agentic work on a full 1M-token context window.',
    cutoff: 'Late 2025',
    tier: 'flagship',
  },
  {
    name: 'Claude Opus 5.5',
    id: 'claude-opus-5-5',
    context: '1M context',
    badge: 'New',
    description:
      'The current Opus, engineered for long-running agentic coding and knowledge tasks. Thinks before answering with chain-of-thought, knowledge to June 2026.',
    cutoff: 'June 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude Opus 5',
    id: 'claude-opus-5',
    context: '1M context',
    description:
      'The Opus flagship predecessor. Deep reflection before answering by default, unmatched reasoning nuance and creative synthesis.',
    cutoff: 'May 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude Sonnet 5',
    id: 'claude-sonnet-5',
    context: '1M context',
    badge: 'New',
    description:
      'Frontier intelligence at Sonnet speed. The standard daily driver for complex codebase refactoring, interactive chats, and high-throughput pipelines.',
    cutoff: 'May 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude 3.7 Sonnet',
    id: 'claude-3-7-sonnet-20250219',
    context: '200K / 1M',
    badge: 'Hybrid Reasoning',
    description:
      'Hybrid reasoning model capable of instant standard responses and extended thinking steps on demand.',
    cutoff: 'Nov 2024',
    tier: 'flagship',
  },
];

const SUPPORTING_MODELS = [
  { name: 'Claude Opus 4.8', id: 'claude-opus-4-8', context: '1M', status: 'Active' },
  { name: 'Claude Opus 4.7', id: 'claude-opus-4-7', context: '1M', status: 'Active' },
  { name: 'Claude Opus 4.6', id: 'claude-opus-4-6', context: '1M', status: 'Active' },
  { name: 'Claude Sonnet 4.6', id: 'claude-sonnet-4-6', context: '1M', status: 'Active' },
  { name: 'Claude Sonnet 3.5 v2', id: 'claude-3-5-sonnet-20241022', context: '200K', status: 'Active' },
  { name: 'Claude Haiku 4.5', id: 'claude-haiku-4-5', context: '1M', status: 'Active' },
  { name: 'Claude Haiku 3.5', id: 'claude-3-5-haiku-20241022', context: '200K', status: 'Active' },
  { name: 'Claude Opus 3', id: 'claude-3-opus-20240229', context: '200K', status: 'Active' },
  { name: 'Claude Sonnet 3', id: 'claude-3-sonnet-20240229', context: '200K', status: 'Active' },
  { name: 'Claude Haiku 3', id: 'claude-3-haiku-20240307', context: '200K', status: 'Active' },
];

export const ModelLineup: React.FC = () => {
  const [showAllSupporting, setShowAllSupporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string) => {
    const success = await copyToClipboard(id);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <section className="py-16 md:py-24 lg:py-28" id="models">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <header className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
            01 — The lineup
          </p>
          <AnimatedTitle
            as="h2"
            className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl"
            lines={[
              ['15', 'models.', 'One'],
              ['endpoint.'],
            ]}
            highlightWords={['One', 'endpoint']}
          />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 max-w-xl text-[16px] leading-relaxed text-slate-400"
          >
            Claude <strong className="text-white">Fable 5.1</strong>,{' '}
            <strong className="text-white">Opus 5.5</strong> and{' '}
            <strong className="text-white">Sonnet 5</strong> are the newest additions, all on a
            1M-token window. Every model answers on the same base URL with the same key — switch per
            request with zero redeployment.
          </motion.p>
        </header>

        {/* Flagship Model Cards Grid */}
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FLAGSHIP_MODELS.map((model, idx) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/60 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/80 hover:shadow-xl hover:shadow-brand-500/5"
            >
              <span className="absolute inset-x-0 top-0 h-[2px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {model.badge && (
                      <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-400 border border-brand-500/30">
                        {model.badge}
                      </span>
                    )}
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      {model.context}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Cutoff: {model.cutoff}
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  {model.name}
                </h3>

                <div className="mt-2 flex items-center justify-between rounded bg-dark-950/80 px-2.5 py-1.5 border border-white/5">
                  <code className="font-mono text-[11px] text-slate-300 truncate">{model.id}</code>
                  <button
                    onClick={() => handleCopy(model.id)}
                    className="ml-2 text-slate-400 hover:text-white transition p-0.5"
                    title={`Copy ${model.name} identifier`}
                    aria-label={`Copy ${model.name} identifier`}
                  >
                    {copiedId === model.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
                  {model.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Pass-through SSE</span>
                <span className="text-emerald-400">● 100% Online</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supporting Models Table */}
        <div className="mt-12 overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-dark-950/70">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Model
                  </th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Model ID
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Context
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {(showAllSupporting ? SUPPORTING_MODELS : SUPPORTING_MODELS.slice(0, 4)).map(
                  (m) => (
                    <tr
                      key={m.id}
                      className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition"
                    >
                      <td className="px-5 py-3.5 text-[14px] font-medium text-white flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        {m.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-400">
                        {m.id}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[12px] text-slate-400">
                        {m.context}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleCopy(m.id)}
                          aria-label={`Copy ${m.name} identifier`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-400 hover:text-brand-300"
                        >
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => setShowAllSupporting(!showAllSupporting)}
          className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-brand-400 transition-opacity hover:opacity-80"
        >
          <span>
            {showAllSupporting
              ? 'Hide supporting models'
              : `Show all ${SUPPORTING_MODELS.length} supporting models`}
          </span>
          {showAllSupporting ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-slate-400">
          Friendly aliases such as <code className="text-brand-300">Opus 4.8</code> are accepted and normalized server-side. Appending <code className="text-brand-300">[1m]</code> to a model name (e.g. <code className="text-brand-300">claude-fable-5-1[1m]</code>) instructs Claude Code CLI to size its internal context budget to 1M.
        </p>
      </div>
    </section>
  );
};
