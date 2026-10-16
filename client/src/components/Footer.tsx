import React from 'react';
import { Zap, Heart, Shield, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenPricing: () => void;
  onOpenDocs: () => void;
  onOpenStatus?: () => void;
  onOpenCheckKey: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPricing,
  onOpenDocs,
  onOpenStatus,
  onOpenCheckKey,
}) => {
  return (
    <footer className="border-t border-white/[0.08] bg-dark-950 py-12 text-slate-400">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 text-[12px] inline-flex items-center justify-center rounded-[6px] bg-brand-500 font-black text-white">
                O
              </span>
              <span className="text-[16px] font-bold tracking-tight text-white font-mono">
                Opus<span className="text-brand-500">zyra</span>
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              High-throughput Anthropic Claude API gateway. Unbuffered SSE streaming, 5-hour
              rolling capacity windows, and instant USDT crypto activation.
            </p>
            <button
              onClick={onOpenStatus}
              className="flex items-center gap-2 text-xs font-mono text-emerald-400 hover:underline text-left"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All 15 Claude Gateway Nodes Operational</span>
            </button>
          </div>

          {/* Navigation Columns */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#models" className="hover:text-white transition">
                  Claude Models
                </a>
              </li>
              <li>
                <button onClick={onOpenPricing} className="hover:text-white transition">
                  Pricing &amp; Plans
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <button onClick={onOpenCheckKey} className="hover:text-white transition">
                  Check Key Usage
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Integrations
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <button onClick={onOpenDocs} className="hover:text-white transition">
                  Claude Code CLI
                </button>
              </li>
              <li>
                <button onClick={onOpenDocs} className="hover:text-white transition">
                  Cursor IDE
                </button>
              </li>
              <li>
                <button onClick={onOpenDocs} className="hover:text-white transition">
                  VS Code &amp; Cline
                </button>
              </li>
              <li>
                <button onClick={onOpenDocs} className="hover:text-white transition">
                  Python SDK
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Legal &amp; Ops
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <span className="hover:text-white cursor-pointer transition">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition">
                  Terms of Service
                </span>
              </li>
              <li>
                <button onClick={onOpenStatus} className="hover:text-white transition text-left">
                  Status Page
                </button>
              </li>
              <li>
                <a
                  href="https://opuszyra.live/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  <span>opuszyra.live</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-8 sm:flex-row text-xs">
          <p>© {new Date().getFullYear()} Opuszyra. All rights reserved.</p>
          <p className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            Engineered with React, Tailwind CSS, Node.js &amp; Supabase
          </p>
        </div>
      </div>
    </footer>
  );
};
