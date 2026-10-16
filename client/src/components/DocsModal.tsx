import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { CodeSwitcher } from './CodeSwitcher';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-dark-900 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-dark-950/80">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Opuszyra Documentation &amp; Setup</h2>
              <p className="text-xs text-slate-400">Claude Code, Cursor, Python, and TypeScript integrations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs font-mono text-slate-300">
            <p className="font-semibold text-orange-400 text-sm mb-1">Standard Gateway URL</p>
            <code className="text-white bg-dark-950 px-2 py-1 rounded border border-white/10">
              https://api.opuszyra.live/v1
            </code>
            <p className="mt-2 text-slate-400">
              All Anthropic official endpoints (<code className="text-slate-300">/v1/messages</code>, <code className="text-slate-300">/v1/complete</code>) are mapped 1:1 with unbuffered streaming and prompt caching support.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Interactive Setup Snippets</h3>
            <CodeSwitcher />
          </div>

          {/* Quick FAQ / Reference */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-sm font-semibold text-white">Frequently Asked Questions</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="rounded-lg bg-dark-950 p-3 border border-white/5">
                <span className="font-semibold text-slate-200 block">Does Claude Code work out of the box?</span>
                <span className="mt-1 block">
                  Yes! Simply run <code className="text-orange-400">export ANTHROPIC_BASE_URL="https://api.opuszyra.live"</code> and <code className="text-orange-400">export ANTHROPIC_API_KEY="opm-live-..."</code> before launching <code className="text-slate-200">claude</code>.
                </span>
              </div>
              <div className="rounded-lg bg-dark-950 p-3 border border-white/5">
                <span className="font-semibold text-slate-200 block">How does the 5-hour rolling window work?</span>
                <span className="mt-1 block">
                  Instead of strict monthly hard stops, your token allowance continuously replenishes every 5 hours. If you exhaust a budget, it resets automatically without requiring top-ups.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
