import React, { useState, useEffect } from 'react';
import { X, BookOpen, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { CodeSwitcher } from './CodeSwitcher';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="docs-modal-title"
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 shadow-2xl max-h-[92vh] flex flex-col text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-6 py-4 bg-slate-50 dark:bg-dark-950/80">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Opuszenvix Logo"
              width="40"
              height="40"
              className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(234,88,12,0.3)]"
            />
            <div>
              <h2 id="docs-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">Opuszenvix Documentation &amp; Setup</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Claude Code, Cursor, Python, and TypeScript integrations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close documentation dialog"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs font-mono text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-orange-600 dark:text-orange-400 text-sm mb-1">Standard Gateway URL</p>
            <code className="text-slate-900 dark:text-white bg-slate-100 dark:bg-dark-950 px-2 py-1 rounded border border-slate-200 dark:border-white/10">
              https://api.opuszenvix.live/v1
            </code>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              All Anthropic official endpoints (<code className="text-slate-800 dark:text-slate-300">/v1/messages</code>, <code className="text-slate-800 dark:text-slate-300">/v1/complete</code>) are mapped 1:1 with unbuffered streaming and prompt caching support.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Interactive Setup Snippets</h3>
            <CodeSwitcher />
          </div>

          {/* Quick FAQ / Reference */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="rounded-lg bg-slate-50 dark:bg-dark-950 p-3 border border-slate-200 dark:border-white/5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Does Claude Code work out of the box?</span>
                <span className="mt-1 block">
                  Yes! Simply run <code className="text-orange-600 dark:text-orange-400">npx opuszenvix</code> (or manually set <code className="text-orange-600 dark:text-orange-400">export ANTHROPIC_BASE_URL="https://api.opuszenvix.live/v1"</code>) before launching <code className="text-slate-800 dark:text-slate-200">claude</code>.
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-dark-950 p-3 border border-slate-200 dark:border-white/5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">How does the 5-hour rolling window work?</span>
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
