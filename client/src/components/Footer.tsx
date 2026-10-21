import React from 'react';
import { getDisplaySupportPhoneNumber, getSupportTelUrl, getWhatsAppSupportUrl } from '../lib/support';

interface FooterProps {
  onOpenPricing: () => void;
  onOpenDocs: () => void;
  onOpenStatus?: () => void;
  onOpenCheckKey: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPricing,
  onOpenDocs,
  onOpenStatus,
  onOpenCheckKey,
  onNavigateSection,
}) => {
  const whatsappUrl = getWhatsAppSupportUrl('Hi! I have an inquiry about OpusZenvix.');
  const supportTel = getSupportTelUrl();
  const displayPhone = getDisplaySupportPhoneNumber();

  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-dark-950/60 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-8">
          
          {/* Brand Column */}
          <div>
            <a href="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="OpusZenvix"
                width="32"
                height="32"
                className="h-8 w-8 rounded-lg object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(234,88,12,0.35)]"
              />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-white text-base">
                Opus<span className="text-brand-500">Zenvix</span>
              </span>
            </a>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              An Anthropic-compatible gateway for the full Claude lineup. One base URL, one key,
              per-key budgets and limits.
            </p>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              api.opuszenvix.pro
            </p>

            {/* Support links */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
                >
                  WhatsApp Support
                </a>
              )}
              {whatsappUrl && supportTel && <span className="text-slate-400 dark:text-slate-600">·</span>}
              {supportTel && (
                <a href={supportTel} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  {displayPhone}
                </a>
              )}
            </div>
          </div>

          {/* Build Nav */}
          <nav aria-label="Build">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate-900 dark:text-white">
              Build
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  onClick={onOpenDocs}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  Setup guide
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenDocs}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  API reference
                </button>
              </li>
              <li>
                <a
                  href="#models"
                  onClick={(e) => {
                    if (onNavigateSection) {
                      e.preventDefault();
                      onNavigateSection('models');
                    }
                  }}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Models
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenDocs}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  Troubleshooting
                </button>
              </li>
            </ul>
          </nav>

          {/* Operate Nav */}
          <nav aria-label="Operate">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate-900 dark:text-white">
              Operate
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  onClick={onOpenCheckKey}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  Check a key
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenStatus}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  Service status
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPricing}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-left"
                >
                  Pricing &amp; Plans
                </button>
              </li>
            </ul>
          </nav>

          {/* Legal Nav */}
          <nav aria-label="Legal">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate-900 dark:text-white">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#terms" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  Terms of use
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  Privacy policy
                </a>
              </li>
            </ul>
          </nav>

        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 dark:border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            © 2026 OpusZenvix
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Keys are delivered instantly via automated gateway
          </p>
        </div>
      </div>
    </footer>
  );
};
