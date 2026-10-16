import React, { useState, useEffect } from 'react';
import { Key, Clock, ShieldCheck, Zap, AlertCircle, RotateCw } from 'lucide-react';
import { checkKey, resetKeyWindow } from '../lib/api';
import { CheckKeyData } from '../types';

interface KeyInspectorProps {
  initialKey?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const DEMO_KEYS = [
  { label: '5× Dev Plan', token: 'opm-live-5x-9f8a3c2e1b4d7f0a' },
  { label: '20× Agentic Plan', token: 'opm-live-20x-8d7e6f5c4b3a2109' },
];

export const KeyInspector: React.FC<KeyInspectorProps> = ({
  initialKey = 'opm-live-5x-9f8a3c2e1b4d7f0a',
  onClose,
  isModal = false,
}) => {
  const [inputKey, setInputKey] = useState(initialKey);
  const [loading, setLoading] = useState(false);
  const [keyData, setKeyData] = useState<CheckKeyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('00:00:00');

  const handleInspect = async (tokenToTest?: string) => {
    const target = tokenToTest || inputKey;
    if (!target.trim()) {
      setError('Please enter a valid Opuszyra API key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await checkKey(target.trim());
      setKeyData(data);
      setCountdown(data.timeRemainingFormatted);
    } catch (err: any) {
      setError(err.message || 'Key inspection failed. Please verify your token.');
      setKeyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    if (initialKey) {
      handleInspect(initialKey);
    }
  }, []);

  // Live countdown timer ticking down
  useEffect(() => {
    if (!keyData || keyData.secondsRemaining <= 0) return;

    let secLeft = keyData.secondsRemaining;
    const interval = setInterval(() => {
      secLeft -= 1;
      if (secLeft <= 0) {
        setCountdown('00:00:00');
        clearInterval(interval);
      } else {
        const h = Math.floor(secLeft / 3600);
        const m = Math.floor((secLeft % 3600) / 60);
        const s = secLeft % 60;
        setCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [keyData]);

  const handleResetWindow = async () => {
    if (!keyData) return;
    try {
      setLoading(true);
      await resetKeyWindow(keyData.id);
      await handleInspect(keyData.key_token);
    } catch (err: any) {
      setError(err.message || 'Failed to reset window');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${isModal ? '' : 'my-12 px-4'}`}>
      <div className="rounded-2xl border border-white/10 bg-dark-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
                Opuszyra <span className="text-amber-400">Key Inspector</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Check live 5-hour rolling quota, window countdowns, and rate limits anonymously.
            </p>
          </div>

          {/* Preset Demo Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono hidden sm:inline">
              Try Demo:
            </span>
            {DEMO_KEYS.map((k) => (
              <button
                key={k.token}
                onClick={() => {
                  setInputKey(k.token);
                  handleInspect(k.token);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
              placeholder="Enter your Opuszyra key (e.g. opm-live-5x-...)"
              className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 text-slate-200 placeholder-slate-600 font-mono text-xs sm:text-sm outline-none transition-all"
            />
          </div>

          <button
            onClick={() => handleInspect()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Inspect Key</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Card */}
        {keyData && (
          <div className="mt-8 pt-8 border-t border-white/[0.08] space-y-6">
            {/* Top Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-dark-950/70 border border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{keyData.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {keyData.tier} Tier
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Realtime Upstream (api.opuszen.shop)</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{keyData.masked_token}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Window Status
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 capitalize">
                    {keyData.status} (Healthy)
                  </div>
                </div>
                <button
                  onClick={handleResetWindow}
                  title="Simulate 5-hour window reset"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gauge & Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rolling Window Reset Countdown */}
              <div className="p-5 rounded-xl bg-dark-950/60 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      5-Hour Window Reset
                    </span>
                    <span className="text-amber-400">Rolling</span>
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-white tracking-wider my-3">
                    {countdown}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Resets 5 hours from your first request. When the timer hits 00:00:00, your quota resets to 100%.
                </p>
              </div>

              {/* Window Token Capacity Bar */}
              <div className="p-5 rounded-xl bg-dark-950/60 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-brand-400" />
                      Window Quota
                    </span>
                    <span className="font-bold text-slate-200">
                      {keyData.percentRemaining}% Remaining
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-dark-850 overflow-hidden my-3 p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        keyData.percentUsed > 80
                          ? 'bg-rose-500'
                          : keyData.percentUsed > 50
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-brand-500'
                      }`}
                      style={{ width: `${Math.max(4, keyData.percentUsed)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1">
                    <span>Used: {(keyData.window_tokens_used / 1_000_000).toFixed(2)}M</span>
                    <span>Limit: {(keyData.window_token_limit / 1_000_000).toFixed(0)}M tokens</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  Remaining in current 5-hour window: <strong className="text-slate-300">{(keyData.window_tokens_remaining / 1_000_000).toFixed(2)}M</strong> tokens
                </p>
              </div>

              {/* Rate Limits & Speed */}
              <div className="p-5 rounded-xl bg-dark-950/60 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Concurrency Limits
                    </span>
                    <span className="text-cyan-400">High-Bandwidth</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-3">
                    <div className="p-2.5 rounded-lg bg-dark-900 border border-white/5">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Rate Limit</div>
                      <div className="text-base font-bold font-mono text-white">
                        {keyData.rate_limit_rpm} <span className="text-xs font-normal text-slate-400">RPM</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-dark-900 border border-white/5">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Token Limit</div>
                      <div className="text-base font-bold font-mono text-white">
                        {(keyData.rate_limit_tpm / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-400">TPM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Lifetime Consumed:</span>
                  <span className="font-mono text-slate-300">
                    {(keyData.total_tokens_consumed / 1_000_000).toFixed(1)}M ({keyData.total_requests} reqs)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
