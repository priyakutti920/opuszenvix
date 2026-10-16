import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTitle } from './AnimatedTitle';

export const Migration: React.FC = () => {
  return (
    <section className="py-16 md:py-24 lg:py-28 bg-[#0a0c12] text-slate-100 border-t border-white/[0.08]" id="migration">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
              03 — Migration
            </p>
            <AnimatedTitle
              className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl"
              lines={[
                ['One', 'line'],
                ['changes.'],
              ]}
              highlightWords={['changes']}
            />
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 max-w-md text-[16px] leading-relaxed text-slate-400"
            >
              No SDK fork, no wrapper library, no rewrite. Repoint the base URL and every request,
              stream and tool call keeps working exactly as it did.
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ transformOrigin: 'left center' }}
              className="mt-8 flex items-center gap-3"
            >
              <span className="h-0.5 w-24 bg-brand-500 rounded-full"></span>
              <span className="text-xs font-mono text-slate-400">100% Protocol drop-in</span>
            </motion.div>
          </div>

          {/* Before & After Code Blocks with Staggered Viewport Entrance */}
          <div className="space-y-4">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-xl border border-red-500/20 bg-dark-950 shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-950/20 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-red-400/80"></span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-red-400 font-semibold">
                  Before — Anthropic Official
                </span>
              </div>
              <div className="overflow-x-auto px-5 py-4 font-mono text-[13px] text-slate-400">
                <span>base_url = </span>
                <span className="text-red-400 line-through">"https://api.anthropic.com"</span>
                <span className="block mt-1 text-[11px] text-slate-400"># Subject to waitlists &amp; strict tier limits</span>
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-xl border border-emerald-500/30 bg-dark-950 shadow-xl shadow-emerald-500/5"
            >
              <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80 animate-ping"></span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400 font-semibold">
                  After — Opuszyra Gateway
                </span>
              </div>
              <div className="overflow-x-auto px-5 py-4 font-mono text-[13px] text-slate-400">
                <span>base_url = </span>
                <span className="text-emerald-400 font-semibold">"https://api.opuszyra.live/v1"</span>
                <span className="block mt-1 text-[11px] text-emerald-400/80 font-mono">
                  ✓ Instant 1M context, 5h rolling allowance &amp; zero waitlist
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
