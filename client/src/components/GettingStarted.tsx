import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

interface GettingStartedProps {
  onOpenPricing?: () => void;
  onOpenDocs?: () => void;
}

export const GettingStarted: React.FC<GettingStartedProps> = () => {
  const [copied, setCopied] = useState(false);
  const snippet = `export ANTHROPIC_BASE_URL=https://api.opuszenvix.pro\nexport ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(snippet);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="get-started" className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        
        {/* Left Column: Headline and Code Snippet */}
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400 font-semibold">
            Setup
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl">
            Three steps, one of them optional.
          </h2>

          <div className="mt-6">
            <div className="border border-slate-700/60 dark:border-white/10 bg-slate-950 text-slate-100 rounded-lg overflow-hidden shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-white/10 px-4 py-2 bg-slate-900/90">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  shell
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Or run{' '}
            <code className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-slate-900 dark:text-white rounded">
              npx opuszenvix
            </code>{' '}
            and let the wizard write it for you.
          </p>
        </div>

        {/* Right Column: 3 Numbered Steps */}
        <div className="min-w-0 lg:pt-2">
          {/* Step 1 */}
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-t border-slate-200 dark:border-white/10 py-7 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6">
            <span className="font-mono text-2xl font-semibold tabular-nums text-brand-500/50 sm:text-3xl">
              01
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Get a key</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Choose your INR plan via instant UPI, with the budget, rate limit and expiry already
                configured. No approval waitlists.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-t border-slate-200 dark:border-white/10 py-7 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6">
            <span className="font-mono text-2xl font-semibold tabular-nums text-brand-500/50 sm:text-3xl">
              02
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Repoint the base URL</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Two environment variables, or one run of the setup wizard. Your existing code is
                untouched.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-t border-b border-slate-200 dark:border-white/10 py-7 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6">
            <span className="font-mono text-2xl font-semibold tabular-nums text-brand-500/50 sm:text-3xl">
              03
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Call any model in the lineup</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Pass a model ID and go. Streaming, tool use, prompt caching and token counting all
                behave as they do upstream.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
