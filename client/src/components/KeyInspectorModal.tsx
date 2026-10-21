import React, { useState, useEffect, useRef } from 'react';
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

  const inspectSeqRef = useRef<number>(0);

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
    const currentSeq = ++inspectSeqRef.current;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await checkKey(token);
      if (currentSeq !== inspectSeqRef.current) return;
      setKeyData(data);
    } catch (err: any) {
      if (currentSeq !== inspectSeqRef.current) return;
      setError(err.message || 'Key inspection failed. Ensure key exists.');
      setKeyData(null);
    } finally {
      if (currentSeq === inspectSeqRef.current) {
        setLoading(false);
      }
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
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 shadow-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-6 py-4 bg-slate-50 dark:bg-dark-950/80">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 id="key-inspector-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">Usage &amp; 5-Hour Window Status</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inspect remaining tokens, reset countdown, and limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close key inspector dialog"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
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
              className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-950 px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 focus:outline-none"
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


          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 dark:text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Safe Initial State: UI does not stay blank when keyData starts as null */}
          {!keyData && !loading && !error && (
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-950 p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                API Key Usage &amp; Sliding Window Inspector
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Enter an API key above and click <strong>Inspect</strong> to view real-time sliding 5-hour window usage, RPM/TPM throughput, and model availability.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono max-w-sm mx-auto pt-1">
                <div className="p-2.5 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 block font-bold">5-Hour Window</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Rolling quota replenishment</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Live Telemetry</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Direct upstream sync</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !keyData && (
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-950 p-8 text-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Inspecting API key status &amp; rolling window...</p>
            </div>
          )}

          {/* Key Data Dashboard */}
          {keyData && (
            <div className="space-y-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-dark-950 p-5 font-mono">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{keyData.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{keyData.masked_token}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                    {keyData.planName || keyData.tier}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    keyData.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : keyData.status === 'paused'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {keyData.status}
                  </span>
                </div>
              </div>

              {/* Progress bar of rolling window */}
              <div>
                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>5-Hour Rolling Allowance:</span>
                  <span className="text-brand-600 dark:text-brand-300 font-bold">
                    {keyData.window_tokens_remaining !== null && keyData.window_tokens_remaining !== undefined
                      ? `${(keyData.window_tokens_remaining / 1000000).toFixed(2)}M`
                      : 'Unavailable'}{' '}
                    / {(Number(keyData.window_token_limit || (keyData.tier === '5x' || keyData.tier === '5x_trial' ? 5000000 : 20000000)) / 1000000).toFixed(0)}M remaining
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-dark-900 border border-slate-300/50 dark:border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${Math.min(keyData.percentUsed ?? 0, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>Used: {keyData.percentUsed !== null && keyData.percentUsed !== undefined ? `${keyData.percentUsed}%` : 'Unavailable'}</span>
                  <span className="text-slate-700 dark:text-slate-300">Resets in: {keyData.timeRemainingFormatted || '05:00:00'}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">5H Window Used</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">
                    {keyData.window_tokens_used !== null ? keyData.window_tokens_used.toLocaleString() : 'Unavailable'}
                  </span>
                </div>
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">RPM Limit</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">{keyData.rate_limit_rpm ?? 60} req/min</span>
                </div>
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">TPM Limit</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">{(Number(keyData.rate_limit_tpm || 1000000) / 1000).toFixed(0)}K tok/min</span>
                </div>
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Lifetime Tokens</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">
                    {Number(keyData.total_tokens_consumed || 0) >= 1000000
                      ? `${(Number(keyData.total_tokens_consumed || 0) / 1000000).toFixed(2)}M`
                      : `${Number(keyData.total_tokens_consumed || 0).toLocaleString()} tok`}
                  </span>
                </div>
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Requests Served</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">{keyData.total_requests ?? 0}</span>
                </div>
                <div className="rounded-lg bg-white dark:bg-dark-900 p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Window Token Limit</span>
                  <span className="text-slate-900 dark:text-white text-base font-bold">{(Number(keyData.window_token_limit || (keyData.tier === '5x' || keyData.tier === '5x_trial' ? 5000000 : 20000000)) / 1000000).toFixed(0)}M tokens</span>
                </div>
              </div>

              {/* Models Accessible */}
              <div className="pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs block mb-2">Supported 1M-Context Models:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(keyData.models_accessible || []).slice(0, 8).map((m) => (
                    <span
                      key={m}
                      className="rounded bg-white dark:bg-dark-900 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5"
                    >
                      {m}
                    </span>
                  ))}
                  {(keyData.models_accessible?.length || 0) > 8 && (
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-600 dark:text-brand-300">
                      +{(keyData.models_accessible?.length || 0) - 8} more
                    </span>
                  )}
                </div>
              </div>

              {/* Reset action */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Testing dev sandbox?</span>
                <button
                  onClick={handleResetWindow}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-brand-500/40 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-brand-500 dark:text-brand-400' : ''}`} />
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
