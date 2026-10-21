import React, { useState, useEffect } from 'react';
import { ArrowRight, Copy, Check, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { copyToClipboard } from '../lib/clipboard';

interface HeroProps {
  onOpenRegister: () => void;
  onOpenCheckKey?: () => void;
  onOpenDocs?: () => void;
}

const FOCUSED_MODELS = [
  { name: 'Claude Fable 5.1', id: 'claude-fable-5-1', context: '1M' },
  { name: 'Claude Opus 5.5', id: 'claude-opus-5-5', context: '1M' },
  { name: 'Claude Sonnet 5', id: 'claude-sonnet-5', context: '1M' },
  { name: 'Claude Fable 5', id: 'claude-fable-5', context: '1M' },
  { name: 'Claude Opus 5', id: 'claude-opus-5', context: '1M' },
];

export const Hero: React.FC<HeroProps> = ({
  onOpenRegister,
  onOpenCheckKey,
  onOpenDocs,
}) => {
  const [modelIndex, setModelIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://api.opuszenvix.pro';

  // Cycle focused model every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % FOCUSED_MODELS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleCopyBaseUrl = async () => {
    const success = await copyToClipboard(baseUrl);
    if (success) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const currentModel = FOCUSED_MODELS[modelIndex];

  // 36 tick marks around circle (every 10 deg)
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i * 10 * Math.PI) / 180;
    const rInner = i % 3 === 0 ? 138 : 142;
    const rOuter = 148;
    const cx = 160;
    const cy = 160;
    const x1 = cx + rInner * Math.sin(angle);
    const y1 = cy - rInner * Math.cos(angle);
    const x2 = cx + rOuter * Math.sin(angle);
    const y2 = cy - rOuter * Math.cos(angle);
    const isPrimary = i % 3 === 0;
    return { x1, y1, x2, y2, isPrimary, key: i };
  });

  return (
    <>
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-24 lg:pt-16 lg:pb-28">
        {/* Background Aperture Grid & Dotted Mask */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="aperture-grid aperture-fade absolute inset-0 opacity-40" />
          <div className="dot-pattern-hero absolute inset-0 opacity-60" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
            
            {/* Left Content Column */}
            <div className="min-w-0">
              {/* Status Ticker Badge */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-brand-400">
                  Claude Fable 5.1 is live
                </p>
              </motion.div>

              {/* Main Headline with preserved inter-word spacing */}
              <h1 className="mt-6 max-w-[15ch] text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl flex flex-wrap items-baseline gap-x-[0.32em] gap-y-1">
                <span className="text-slate-900 dark:text-white">One</span>
                <span className="text-slate-900 dark:text-white">base</span>
                <span className="text-slate-900 dark:text-white">URL.</span>
                <span className="text-brand-500">The</span>
                <span className="text-brand-500">entire</span>
                <span className="text-brand-500">Claude</span>
                <span className="text-brand-500">lineup.</span>
              </h1>

              {/* Description Paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg"
              >
                Fable 5.1 just landed, alongside every Fable, Opus, Sonnet and Haiku already in service.
                Point an Anthropic-compatible client at OpusZenvix and the only thing that changes is the
                base URL — same SDK, same request shape, same streaming.
              </motion.p>

              {/* CTA Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <button
                  onClick={onOpenRegister}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand-500 px-7 text-[15px] font-medium text-white transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:w-auto shadow-sm hover:shadow"
                >
                  <span>Get instant access</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={onOpenCheckKey}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 border border-slate-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.03] px-7 text-[15px] font-medium text-slate-800 dark:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.08] sm:w-auto shadow-sm dark:shadow-none"
                >
                  <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Check a key</span>
                </button>
              </motion.div>

              {/* Base URL Box with Copy Button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 max-w-md"
              >
                <div className="flex items-stretch border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-dark-900/80 backdrop-blur-md shadow-sm">
                  <span className="flex shrink-0 items-center border-r border-slate-200 dark:border-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    base url
                  </span>
                  <code className="flex-1 overflow-x-auto whitespace-nowrap px-3 py-2.5 font-mono text-[13px] text-slate-900 dark:text-white">
                    {baseUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyBaseUrl}
                    aria-label="Copy base URL"
                    className="flex shrink-0 items-center border-l border-slate-200 dark:border-white/10 px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                  >
                    {copiedUrl ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Precision SVG Aperture Dial */}
            <div className="min-w-0">
              <div className="relative w-full">
                <div className="relative mx-auto w-full max-w-[26rem]">
                  <svg
                    viewBox="0 0 320 320"
                    className="w-full select-none"
                    role="img"
                    aria-label="Claude Fable 5.1, 1M token context window"
                  >
                    <defs>
                      <clipPath id="aperture-housing-zenvix">
                        <circle cx="160" cy="160" r="132" />
                      </clipPath>
                    </defs>

                    {/* Radial Perimeter Ticks */}
                    <g>
                      {ticks.map((t) => (
                        <line
                          key={t.key}
                          x1={t.x1}
                          y1={t.y1}
                          x2={t.x2}
                          y2={t.y2}
                          strokeWidth={t.isPrimary ? '1.5' : '1'}
                          className={t.isPrimary ? 'stroke-brand-500/80' : 'stroke-slate-300 dark:stroke-white/15'}
                        />
                      ))}
                    </g>

                    {/* Rotating Aperture Mechanism */}
                    <g
                      className="transition-transform duration-1000 ease-out"
                      style={{
                        transformBox: 'view-box',
                        transformOrigin: '50% 50%',
                        transform: `rotate(${modelIndex * 60}deg)`,
                      }}
                    >
                      <g clipPath="url(#aperture-housing-zenvix)">
                        {/* Housing backdrop */}
                        <circle cx="160" cy="160" r="132" className="fill-slate-100 dark:fill-dark-900 stroke-slate-200 dark:stroke-transparent" />
                        
                        {/* Concentric Guide Rings */}
                        <g className="stroke-slate-400/40 dark:stroke-white" strokeOpacity="0.12" strokeWidth="1">
                          <circle cx="160" cy="160" r="26" fill="none" />
                          <circle cx="160" cy="160" r="52" fill="none" />
                          <circle cx="160" cy="160" r="78" fill="none" />
                          <circle cx="160" cy="160" r="104" fill="none" />
                          <line x1="32" y1="160" x2="288" y2="160" />
                          <line x1="160" y1="32" x2="160" y2="288" />
                        </g>

                        {/* Aperture Center Dot */}
                        <circle cx="160" cy="160" r="3" className="fill-brand-500" />

                        {/* 6 Overlapping Blade Circles */}
                        <g transform="translate(0 -150)">
                          <circle cx="160" cy="278" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                        <g transform="translate(129.904 -75)">
                          <circle cx="57.809" cy="219" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                        <g transform="translate(129.904 75)">
                          <circle cx="57.809" cy="101" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                        <g transform="translate(0 150)">
                          <circle cx="160" cy="42" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                        <g transform="translate(-129.904 75)">
                          <circle cx="262.191" cy="101" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                        <g transform="translate(-129.904 -75)">
                          <circle cx="262.191" cy="219" r="92" className="fill-white/85 dark:fill-dark-950/90 stroke-slate-300/80 dark:stroke-white/10" strokeWidth="1" />
                        </g>
                      </g>

                      {/* Outer Rings */}
                      <circle cx="160" cy="160" r="132" fill="none" strokeWidth="1.5" className="stroke-slate-300 dark:stroke-white/20" />
                      <circle cx="160" cy="160" r="126" fill="none" strokeWidth="1" className="stroke-slate-200 dark:stroke-white/10" />
                    </g>
                  </svg>

                  {/* Central 1M Context Badge */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center justify-center rounded-full bg-white/90 dark:bg-dark-950/85 border border-slate-200 dark:border-white/10 w-24 h-24 sm:w-28 sm:h-28 shadow-xl dark:shadow-2xl backdrop-blur-sm">
                      <p className="font-mono text-3xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-4xl drop-shadow-sm dark:drop-shadow-md">
                        1M
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-brand-600 dark:text-brand-400 font-semibold">
                        context
                      </p>
                    </div>
                  </div>
                </div>

                {/* Model Focus Ticker at bottom */}
                <div className="mx-auto mt-6 flex max-w-[26rem] items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Focused on
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentModel.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                        className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white"
                      >
                        {currentModel.name}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.code
                      key={currentModel.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0 truncate font-mono text-[11px] text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 font-medium"
                    >
                      {currentModel.id}
                    </motion.code>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Metrics Bar directly below hero */}
      <section className="border-y border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-dark-950/40 transition-colors">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Models
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                17
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Max context
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                1M
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Token window
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                5h
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Endpoints to change
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                0
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
