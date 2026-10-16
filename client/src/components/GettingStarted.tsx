import React from 'react';
import { ArrowRight, QrCode, Terminal, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTitle } from './AnimatedTitle';

interface GettingStartedProps {
  onOpenPricing: () => void;
  onOpenDocs: () => void;
}

export const GettingStarted: React.FC<GettingStartedProps> = ({
  onOpenPricing,
  onOpenDocs,
}) => {
  return (
    <section className="py-16 md:py-24 lg:py-28 border-t border-white/[0.08]" id="get-started">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
            04 — Getting started
          </p>
          <AnimatedTitle
            className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl"
            lines={[
              ['Three', 'steps.'],
              ['Under', 'two', 'minutes.'],
            ]}
            highlightWords={['Under', 'two', 'minutes']}
          />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-slate-400 text-[16px]"
          >
            Fast onboarding designed for active engineers. No verification bottlenecks.
          </motion.p>
        </header>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          {/* Animated Connector Line for Desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left center' }}
            aria-hidden="true"
            className="absolute top-6 left-12 right-12 hidden h-[2px] bg-gradient-to-r from-brand-500/60 via-amber-500/40 to-brand-500/60 md:block"
          ></motion.div>

          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/40 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/60"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
            ></span>
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 font-mono text-[14px] font-bold text-brand-400 shadow-md">
                01
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">
                Choose your tier
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                Select between the 5x Standard dev tier or the 20x Heavy Agentic tier. No KYC, no
                approval queues.
              </p>
            </div>
            <button
              onClick={onOpenPricing}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-400 hover:text-brand-300"
            >
              <span>View tiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/40 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/60"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
            ></span>
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 font-mono text-[14px] font-bold text-brand-400 shadow-md">
                02
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">
                Pay with UPI or Cards
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                Plans start from ₹1,300 in INR via any UPI app (GPay, PhonePe, Paytm, BHIM) or cards. Your
                key is delivered immediately after payment.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>Instant automated provisioning</span>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-dark-900/40 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:bg-dark-850/60"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
            ></span>
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 font-mono text-[14px] font-bold text-brand-400 shadow-md">
                03
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">
                Point your base URL
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                One environment variable. Claude Code, Cursor, VS Code and official SDKs pick it up
                immediately on restart.
              </p>
            </div>
            <button
              onClick={onOpenDocs}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-400 hover:text-brand-300"
            >
              <span>See setup commands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
