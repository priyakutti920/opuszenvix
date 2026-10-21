import React from 'react';
import { motion } from 'framer-motion';

const CONTROLS = [
  {
    num: '01',
    title: 'Per-key token budgets',
    desc: 'Every key carries its own 5-hour rolling window. Spend it, and the key waits for the reset — no surprise overage.',
  },
  {
    num: '02',
    title: 'Isolated rate limits and expiry',
    desc: 'Requests per minute and an expiry date are set per key, not per account. One noisy key cannot starve another.',
  },
  {
    num: '03',
    title: 'Streaming passed straight through',
    desc: 'Server-sent events are forwarded as they arrive. Token-by-token output behaves exactly as your SDK expects.',
  },
  {
    num: '04',
    title: 'Prompt caching, uncharged',
    desc: 'Cache reads and cache writes do not count against a key’s window. Only fresh input and output tokens do.',
  },
  {
    num: '05',
    title: 'Drop-in Anthropic compatibility',
    desc: 'The request and response shapes are the ones you already code against. No adapter, no SDK fork, no rewrite.',
  },
  {
    num: '06',
    title: 'Works with the tools you use',
    desc: 'Claude Code, Cursor, VS Code, Windsurf, Cline, Roo Code, the Python and TypeScript SDKs, and plain cURL.',
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-dark-950/25 transition-colors">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          
          {/* Left Column: Sticky Title & Description */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400 font-semibold"
            >
              Control
            </motion.p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl">
              Built for whoever holds the keys.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Multi-tenant key management with real limits behind it: budgets, rates, expiry and
              usage tracking, plus instant UPI &amp; INR activation.
            </p>
          </div>

          {/* Right Column: 6-Card Numbered Grid */}
          <div className="grid min-w-0 gap-px bg-slate-200 dark:bg-white/10 sm:grid-cols-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
            {CONTROLS.map((c) => (
              <div
                key={c.num}
                className="group h-full bg-white dark:bg-dark-900/90 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-dark-850"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 font-semibold">
                  {c.num}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-slate-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
