import React from 'react';
import { Gauge, Radio, Database, Blocks, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTitle } from './AnimatedTitle';

export const Features: React.FC = () => {
  return (
    <section className="py-16 md:py-24 lg:py-28 border-t border-white/[0.08]" id="features">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
            02 — What you get
          </p>
          <AnimatedTitle
            as="h2"
            className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl"
            lines={[
              ['Built', 'for', 'people'],
              ['who', 'ship.'],
            ]}
            highlightWords={['who', 'ship']}
          />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-[16px] leading-relaxed text-slate-400"
          >
            Budgets that hold, streaming that doesn't buffer, and tools that are already switched on.
            The controls you'd build yourself if you had the week.
          </motion.p>
        </header>

        {/* 2 Big Top Cards with exact viewport scroll triggers */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {/* Card 1: Per-key budgets */}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/60 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/80"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2.5px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-400"
            ></span>
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                <Gauge className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">
                Per-key budgets that hold
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                Give every key its own allowance on a rolling five-hour window. Watch it drain in real
                time; it resets automatically without downtime.
              </p>
            </div>

            <div className="mt-6 space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400">key-prod</span>
                <div className="h-2 flex-1 rounded-full bg-dark-950 overflow-hidden border border-white/5">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 0.75 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left center' }}
                    className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                  ></motion.span>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-300">$7.50</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400">key-dev</span>
                <div className="h-2 flex-1 rounded-full bg-dark-950 overflow-hidden border border-white/5">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 0.4 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left center' }}
                    className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                  ></motion.span>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-300">$4.00</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400">key-agent</span>
                <div className="h-2 flex-1 rounded-full bg-dark-950 overflow-hidden border border-white/5">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 0.2 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left center' }}
                    className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                  ></motion.span>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-300">$2.00</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Pure Streaming Pass-Through */}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/60 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/80"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2.5px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-400"
            ></span>
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">
                Streaming with nothing in the middle
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                Server-sent events pass straight through. Tokens reach your client as they are
                produced — zero buffering layer, no re-chunking, lowest time-to-first-token.
              </p>
            </div>

            {/* Exact SVG Animated Sine Wave */}
            <div className="mt-6 pt-4 border-t border-white/5 relative h-20 flex items-center justify-center">
              <svg
                className="h-16 w-full text-brand-500"
                viewBox="0 0 400 64"
                fill="none"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M0 32 C 40 8, 80 56, 120 32 S 200 8, 240 32 S 320 56, 400 32"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.85"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.85 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: 'easeInOut' }}
                  className="animate-wave-stream"
                />
                <motion.path
                  d="M0 32 C 40 16, 80 48, 120 32 S 200 16, 240 32 S 320 48, 400 32"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.35 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, delay: 0.2, ease: 'easeInOut' }}
                  className="animate-wave-stream"
                  style={{ animationDirection: 'reverse', animationDuration: '9s' }}
                />
              </svg>
              <div className="absolute bottom-1 right-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Latency: ~18ms TTFT</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4 Bottom Grid Cards with Staggered Entrance */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Database,
              title: 'Prompt caching, free',
              desc: 'Cache reads never count against your window. Keep a large system prompt hot and pay for it once.',
              badge: '100% Free Cache',
            },
            {
              icon: Blocks,
              title: 'Drop-in SDK compatible',
              desc: 'Anthropic request and response shapes, unchanged. The official Python and TypeScript SDKs work as-is.',
              badge: 'Drop-in Protocol',
            },
            {
              icon: Sparkles,
              title: 'Tools with nothing to install',
              desc: 'Web search and image analysis run server-side and trigger automatically. No MCP config, no extra client packages.',
              badge: 'Server Tools',
            },
            {
              icon: LayoutDashboard,
              title: 'Usage you can actually read',
              desc: 'Live request history, per-model breakdown and 5-hour window countdown — for every key you generate.',
              badge: 'Live Metring',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/40 p-5 transition-colors hover:border-brand-500/40 hover:bg-dark-850/60"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
              ></span>
              <div>
                <item.icon className="h-5 w-5 text-brand-400" />
                <h3 className="mt-4 text-[15px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">{item.desc}</p>
              </div>
              <span className="mt-4 text-[11px] font-mono text-emerald-400">{item.badge}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats counter strip */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 rounded-2xl border border-white/[0.08] bg-dark-900/40 py-8 px-6 backdrop-blur-sm"
        >
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            <div className="flex flex-col items-center sm:items-start sm:px-6">
              <dt className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                2,000+
              </dt>
              <dd className="mt-1 text-[13px] uppercase tracking-[0.14em] text-slate-400">
                Active developers
              </dd>
            </div>

            <div className="flex flex-col items-center sm:items-start sm:px-6 pt-6 sm:pt-0">
              <dt className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                500K+
              </dt>
              <dd className="mt-1 text-[13px] uppercase tracking-[0.14em] text-slate-400">
                API requests / day
              </dd>
            </div>

            <div className="flex flex-col items-center sm:items-start sm:px-6 pt-6 sm:pt-0">
              <dt className="font-mono text-3xl font-bold tracking-tight text-emerald-400 sm:text-4xl">
                99.98%
              </dt>
              <dd className="mt-1 text-[13px] uppercase tracking-[0.14em] text-slate-400">
                Proxy Uptime
              </dd>
            </div>
          </dl>
        </motion.div>
      </div>
    </section>
  );
};
