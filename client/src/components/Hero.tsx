import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Terminal, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedTitle } from './AnimatedTitle';

interface HeroProps {
  onOpenRegister: () => void;
  onOpenPricing: () => void;
  onOpenPlayground: () => void;
}

const MODELS = [
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-sonnet-5',
  'claude-fable-5',
  'claude-opus-5',
];

export const Hero: React.FC<HeroProps> = ({
  onOpenRegister,
  onOpenPricing,
  onOpenPlayground,
}) => {
  const [activeModelIdx, setActiveModelIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullCommand = 'export ANTHROPIC_BASE_URL="https://api.opuszyra.live/v1"';

  // Typing effect on terminal
  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx <= fullCommand.length) {
        setTypedText(fullCommand.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Model ticker roll
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveModelIdx((prev) => (prev + 1) % MODELS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-14 pb-16 md:pt-20 md:pb-24 lg:pt-24 overflow-hidden">
      {/* Background Grid Veil as seen on opusmax.live */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="grid-veil absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-brand-500/10 rounded-full blur-[130px] -z-10 pointer-events-none"></div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 relative">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column - Copy & CTA */}
          <div className="lg:col-span-7">
            {/* Live Release Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-dark-900/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                <span>New — Fable 5.1 &amp; Sonnet 5, live</span>
              </span>
            </motion.div>

            {/* Word-by-Word Stagger Reveal Headline */}
            <AnimatedTitle
              className="mt-7 text-[2.6rem] font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.25rem]"
              lines={[
                ['The', 'whole', 'Claude'],
                ['lineup.', 'One', 'key.'],
                ['No', 'waitlist.'],
              ]}
              highlightWords={['One', 'key']}
            />

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-slate-400">
                Claude <strong className="font-semibold text-white">Fable 5.1</strong> and{' '}
                <strong className="font-semibold text-white">Sonnet 5</strong> are live here alongside
                every Opus, Sonnet and Haiku release — same endpoint, same key,{' '}
                <span className="text-brand-300 font-medium">1M-token window</span>. Swap one
                environment variable and keep building.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenRegister}
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Get instant access</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={onOpenPricing}
                  className="group inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-dark-900/60 px-5 text-[15px] font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-dark-850 hover:text-white"
                >
                  <span>See pricing</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-slate-400 group-hover:text-white" />
                </button>

                <button
                  onClick={onOpenPlayground}
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/10 px-5 text-[15px] font-medium text-brand-300 transition-colors hover:bg-brand-500/20"
                >
                  <Terminal className="h-4 w-4" />
                  <span>Test Live Streaming</span>
                </button>
              </div>

              {/* Pricing subtext */}
              <p className="mt-5 text-[13px] text-slate-400 font-mono flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Plans from ₹1,300 (INR) · key delivered instantly · no Anthropic approval needed
              </p>
            </motion.div>
          </div>

          {/* Right Column - Exact 3D Perspective Floating Terminal Preview */}
          <div className="lg:col-span-5">
            <div className="relative group">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 -z-10 overflow-hidden rounded-[2rem] sm:-inset-6"
              >
                <div
                  className="absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-500"
                  style={{
                    background:
                      'radial-gradient(60% 55% at 65% 25%, rgba(249, 115, 22, 0.32), transparent 70%)',
                  }}
                ></div>
              </div>

              {/* Terminal Frame with 3D Entrance */}
              <motion.div
                initial={{ opacity: 0, y: 26, rotateX: 6 }}
                animate={{ opacity: 1, y: 0, rotateX: 4 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ perspective: 1200 }}
                className="terminal-3d overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14] shadow-2xl"
              >
                {/* Titlebar */}
                <div className="flex items-center gap-2 border-b border-white/[0.08] bg-dark-900/90 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"></span>
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">opuslive</span>
                  
                  <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    connected
                  </div>
                </div>

                {/* Terminal Body with Animated Typewriter Command */}
                <div className="space-y-3 px-5 py-5 font-mono text-[12.5px] leading-relaxed text-slate-300">
                  <div className="flex items-start justify-between group/cmd min-h-[28px]">
                    <p className="break-all text-slate-200">
                      <span className="text-emerald-400 select-none">$ </span>
                      <span>{typedText}</span>
                      <span className="animate-cursor text-brand-400 font-bold ml-0.5">▌</span>
                    </p>
                    <button
                      onClick={handleCopy}
                      title="Copy command"
                      className="ml-2 p-1 text-slate-400 hover:text-white rounded transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="break-all text-slate-200">
                    <span className="text-emerald-400 select-none">$ </span>
                    <span className="text-slate-400">export </span>
                    <span className="text-brand-300">ANTHROPIC_API_KEY</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-amber-300">"opm-live-5x-9f8a3c2e1b4..."</span>
                  </p>

                  <div className="pt-2 border-t border-white/5 text-[12px] text-slate-400 space-y-1">
                    <p className="text-emerald-400 flex items-center gap-2">
                      <span>✓</span>
                      <span>1M context enabled with unbuffered pass-through</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-2">
                      <span className="text-brand-400">⚡</span>
                      <span>5-hour rolling allowance: 25,000,000 tokens active</span>
                    </p>
                  </div>
                </div>

                {/* Terminal Status Footer with Smooth Animated Model Roll */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/[0.08] bg-dark-900/90 px-4 py-2.5 font-mono text-[11px] text-slate-400">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-slate-400">model</span>
                    <span className="relative inline-flex h-4 min-w-[9.5rem] items-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={activeModelIdx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="text-brand-400 font-bold inline-block"
                        >
                          {MODELS[activeModelIdx]}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">context</span>{' '}
                    <span className="text-white font-semibold">1M</span>
                  </div>
                  <div>
                    <span className="text-slate-400">window</span>{' '}
                    <span className="text-white font-semibold">5h rolling</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
