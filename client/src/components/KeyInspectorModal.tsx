import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, AlertCircle, ShieldCheck, Clock, Zap, Check } from 'lucide-react';
import { checkKey, resetKeyWindow } from '../lib/api';
import { CheckKeyData } from '../types';

interface KeyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKey?: string;
}

export const KeyInspectorModal: React.FC<KeyInspectorModalProps> = ({
  isOpen,
  onClose,
  initialKey = '',
}) => {
  const [keyInput, setKeyInput] = useState(initialKey);
  const [keyData, setKeyData] = useState<CheckKeyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleInspect = async (tokenToTest?: string) => {
    const rawToken = tokenToTest !== undefined ? tokenToTest : keyInput;
    const token = (rawToken || '').trim();
    if (!token) {
      setError('Please enter an API key to inspect.');
      setKeyData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await checkKey(token);
      setKeyData(data);
    } catch (err: any) {
      setError(err.message || 'Key inspection failed. Ensure key exists.');
      setKeyData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const token = (initialKey && initialKey.trim()) || '';
      if (token) {
        setKeyInput(token);
        handleInspect(token);
      } else {
        setKeyData(null);
        setError('');
        setSuccessMsg('');
        setLoading(false);
      }
    }
  }, [isOpen, initialKey]);

  const handleResetWindow = async () => {
    if (!keyData) return;
    setResetting(true);
    setError('');
    try {
      await resetKeyWindow(keyData.id);
      setSuccessMsg('Window token limit reset successfully! Full quota restored.');
      // Refresh key status
      await handleInspect(keyInput);
    } catch (err: any) {
      setError(err.message || 'Failed to reset window');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        aria-labelledby="key-inspector-modal-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-dark-900 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-dark-950/80">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 id="key-inspector-modal-title" className="text-lg font-bold text-white">Usage &amp; 5-Hour Window Status</h2>
              <p className="text-xs text-slate-400">Inspect remaining tokens, reset countdown, and limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close key inspector dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste your key: opm-live-5x-..."
              aria-label="Paste your API key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
              className="flex-1 rounded-lg border border-white/10 bg-dark-950 px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={() => handleInspect()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Checking...' : 'Inspect'}</span>
            </button>
          </div>

          {/* Quick Demo Keys */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Quick inspect:</span>
            <button
              onClick={() => {
                const sample = 'opm-live-5x-9f8a3c2e1b4d7f0a';
                setKeyInput(sample);
                handleInspect(sample);
              }}
              className="text-brand-400 hover:underline"
            >
              Dev Key (5x)
            </button>
            <span>·</span>
            <button
              onClick={() => {
                const sample = 'opm-live-20x-8d7e6f5c4b3a2109';
                setKeyInput(sample);
                handleInspect(sample);
              }}
              className="text-brand-400 hover:underline"
            >
              Agent Key (20x)
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-mono">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Key Data Dashboard */}
          {keyData && (
            <div className="space-y-5 rounded-xl border border-white/[0.08] bg-dark-950 p-5 font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{keyData.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{keyData.masked_token}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-400 uppercase">
                    {keyData.tier}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                    {keyData.status}
                  </span>
                </div>
              </div>

              {/* Progress bar of rolling window */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>5-Hour Rolling Allowance:</span>
                  <span className="text-brand-300 font-bold">
                    {keyData.window_tokens_remaining !== null ? `${(keyData.window_tokens_remaining / 1000000).toFixed(2)}M` : 'N/A'} / {(keyData.window_token_limit / 1000000).toFixed(0)}M remaining
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-dark-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${Math.min(keyData.percentUsed ?? 0, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Used: {keyData.percentUsed !== null ? `${keyData.percentUsed}%` : 'N/A'}</span>
                  <span className="text-slate-300">Resets in: {keyData.timeRemainingFormatted}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-lg bg-dark-900 p-3 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">RPM Limit</span>
                  <span className="text-white text-base font-bold">{keyData.rate_limit_rpm} req/min</span>
                </div>
                <div className="rounded-lg bg-dark-900 p-3 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">TPM Limit</span>
                  <span className="text-white text-base font-bold">{(keyData.rate_limit_tpm / 1000).toFixed(0)}K tok/min</span>
                </div>
                <div className="rounded-lg bg-dark-900 p-3 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Total Lifetime Tokens</span>
                  <span className="text-white text-base font-bold">{(keyData.total_tokens_consumed / 1000000).toFixed(2)}M</span>
                </div>
                <div className="rounded-lg bg-dark-900 p-3 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Total Requests Served</span>
                  <span className="text-white text-base font-bold">{keyData.total_requests}</span>
                </div>
              </div>

              {/* Models Accessible */}
              <div className="pt-2">
                <span className="text-slate-400 text-xs block mb-2">Supported 1M-Context Models:</span>
                <div className="flex flex-wrap gap-1.5">
                  {keyData.models_accessible.slice(0, 8).map((m) => (
                    <span
                      key={m}
                      className="rounded bg-dark-900 px-2 py-0.5 text-[10px] text-slate-300 border border-white/5"
                    >
                      {m}
                    </span>
                  ))}
                  {keyData.models_accessible.length > 8 && (
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-300">
                      +{keyData.models_accessible.length - 8} more
                    </span>
                  )}
                </div>
              </div>

              {/* Reset action */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Testing dev sandbox?</span>
                <button
                  onClick={handleResetWindow}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-brand-500/40 px-3 py-1.5 text-xs text-slate-200 hover:text-white transition"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-brand-400' : ''}`} />
                  <span>{resetting ? 'Resetting...' : 'Instant Window Reset'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
