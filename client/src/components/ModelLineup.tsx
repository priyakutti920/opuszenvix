import React, { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { copyToClipboard } from '../lib/clipboard';

export interface ModelItem {
  id: string;
  name: string;
  short: string;
  family: 'fable' | 'opus' | 'sonnet' | 'haiku';
  context: string;
  blurb: string;
  tag?: 'new' | 'fastest' | 'legacy';
}

const ALL_17_MODELS: ModelItem[] = [
  {
    id: 'claude-fable-5-1',
    name: 'Claude Fable 5.1',
    short: 'Fable 5.1',
    family: 'fable',
    context: '1M',
    blurb: 'Most capable in the lineup. Demanding reasoning and long-horizon agentic work; knowledge current to June 2026.',
    tag: 'new',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    short: 'Fable 5',
    family: 'fable',
    context: '1M',
    blurb: 'Previous Fable generation. Still strong on long agentic runs.',
  },
  {
    id: 'claude-opus-5-5',
    name: 'Claude Opus 5.5',
    short: 'Opus 5.5',
    family: 'opus',
    context: '1M',
    blurb: 'The current Opus. Thinking on by default; knowledge current to June 2026.',
    tag: 'new',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    short: 'Opus 5',
    family: 'opus',
    context: '1M',
    blurb: 'Previous Opus generation. Thinking on by default; knowledge current to May 2026.',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    short: 'Sonnet 5',
    family: 'sonnet',
    context: '1M',
    blurb: 'Frontier intelligence at Sonnet speed. The new default.',
    tag: 'new',
  },
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    short: 'Opus 4.8',
    family: 'opus',
    context: '1M',
    blurb: 'Opus from the 4.8 generation. Adaptive thinking and agentic coding.',
  },
  {
    id: 'claude-opus-4-7',
    name: 'Claude Opus 4.7',
    short: 'Opus 4.7',
    family: 'opus',
    context: '1M',
    blurb: 'Previous flagship. Still excellent for long agentic runs.',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    short: 'Opus 4.6',
    family: 'opus',
    context: '1M',
    blurb: 'Deep reasoning for complex, multi-step problems.',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    short: 'Sonnet 4.6',
    family: 'sonnet',
    context: '1M',
    blurb: 'Balanced speed and reasoning for everyday engineering work.',
  },
  {
    id: 'claude-opus-4-5',
    name: 'Claude Opus 4.5',
    short: 'Opus 4.5',
    family: 'opus',
    context: '200K',
    blurb: 'Strong general reasoning at a smaller context.',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    short: 'Sonnet 4.5',
    family: 'sonnet',
    context: '200K',
    blurb: 'Dependable mid-weight model for day-to-day tasks.',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    short: 'Haiku 4.5',
    family: 'haiku',
    context: '200K',
    blurb: 'Fastest in the lineup. Built for high-throughput calls.',
    tag: 'fastest',
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    short: 'Opus 4.1',
    family: 'opus',
    context: '200K',
    blurb: 'Kept available for pinned workloads.',
    tag: 'legacy',
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    short: 'Opus 4',
    family: 'opus',
    context: '200K',
    blurb: 'Kept available for pinned workloads.',
    tag: 'legacy',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    short: 'Sonnet 4',
    family: 'sonnet',
    context: '200K',
    blurb: 'Kept available for pinned workloads.',
    tag: 'legacy',
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5',
    short: 'Sonnet 5.5',
    family: 'sonnet',
    context: '1M',
    blurb: 'Available on every OpusZenvix key.',
  },
  {
    id: 'claude-haiku-5-5',
    name: 'Claude Haiku 5.5',
    short: 'Haiku 5.5',
    family: 'haiku',
    context: '200K',
    blurb: 'Available on every OpusZenvix key.',
  },
];

const FLAGSHIP_TRIO = [
  ALL_17_MODELS[0], // Fable 5.1
  ALL_17_MODELS[2], // Opus 5.5
  ALL_17_MODELS[4], // Sonnet 5
];

export const ModelLineup: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string) => {
    const ok = await copyToClipboard(id);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <section id="models" className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
      {/* Header */}
      <div className="max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-brand-400"
        >
          The lineup
        </motion.p>

        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl">
          A new model at the front of the line.
        </h2>

        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Fable 5.1 is the most capable model available here — reasoning over a million tokens of
          context, built for long agentic runs, with knowledge current to June 2026. Fable 5, Opus 5.5
          and Sonnet 5 stay right behind it, available on the same key.
        </p>

        {/* Visual Context Window Tick Meter */}
        <div className="mt-8">
          <div aria-hidden="true" className="flex items-end gap-[3px]">
            {Array.from({ length: 28 }).map((_, i) => {
              const isMajor = i % 4 === 0;
              return (
                <span
                  key={i}
                  className={`w-px origin-bottom transition-all ${
                    isMajor ? 'h-3 bg-brand-500/80' : 'h-1.5 bg-slate-300 dark:bg-white/15'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Featured Cards with Signature Corner Brackets */}
      <div className="mt-12">
        <div className="grid gap-4 md:grid-cols-3">
          {FLAGSHIP_TRIO.map((m) => (
            <div
              key={m.id}
              tabIndex={0}
              className="group relative border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-dark-900/60 shadow-sm dark:shadow-none flex flex-col p-6 transition-all hover:border-brand-500/50 hover:shadow-md"
            >
              {/* Corner hover bracket indicators */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                <span className="absolute h-3 w-3 border-transparent transition-colors duration-200 group-hover:border-brand-500 left-0 top-0 border-l-2 border-t-2" />
                <span className="absolute h-3 w-3 border-transparent transition-colors duration-200 group-hover:border-brand-500 right-0 top-0 border-r-2 border-t-2" />
                <span className="absolute h-3 w-3 border-transparent transition-colors duration-200 group-hover:border-brand-500 left-0 bottom-0 border-l-2 border-b-2" />
                <span className="absolute h-3 w-3 border-transparent transition-colors duration-200 group-hover:border-brand-500 right-0 bottom-0 border-r-2 border-b-2" />
              </span>

              {/* Family Tag & New Badge */}
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {m.family}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  New
                </span>
              </div>

              {/* Title & Blurb */}
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {m.name}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {m.blurb}
              </p>

              {/* Context and Model ID chip */}
              <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Context
                  </span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {m.context}
                  </span>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(m.id)}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 transition-colors hover:border-brand-500/40 hover:text-slate-900 dark:hover:text-white"
                    title="Copy model ID"
                  >
                    <span className="truncate">{m.id}</span>
                    {copiedId === m.id ? (
                      <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Complete Lineup 17 models Accordion */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="group flex w-full items-center justify-between border-y border-slate-200 dark:border-white/10 py-4 text-left transition-colors hover:border-brand-500/40"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-900 dark:text-white font-medium">
              Complete lineup — 17 models
            </span>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
              {showAll ? 'Hide list' : 'Show all'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showAll ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>

          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-b border-slate-200 dark:border-white/10"
              >
                <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06] py-2">
                  {ALL_17_MODELS.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-12 sm:items-center sm:gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] px-2 transition-colors rounded"
                    >
                      <div className="sm:col-span-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                          {item.tag === 'new' && (
                            <span className="rounded bg-brand-500/15 dark:bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400 border border-brand-500/30">
                              New
                            </span>
                          )}
                          {item.tag === 'fastest' && (
                            <span className="rounded bg-emerald-500/15 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Fastest
                            </span>
                          )}
                          {item.tag === 'legacy' && (
                            <span className="rounded bg-slate-500/15 dark:bg-slate-500/20 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-500/30">
                              Legacy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.blurb}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {item.context} context
                        </span>
                      </div>

                      <div className="sm:col-span-6 sm:text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id)}
                          className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-950 px-2.5 py-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:border-brand-500/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>{item.id}</span>
                          {copiedId === item.id ? (
                            <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
