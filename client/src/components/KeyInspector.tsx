import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Clock, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  RotateCw, 
  Copy, 
  Check, 
  Activity, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Code2
} from 'lucide-react';
import { checkKey, resetKeyWindow } from '../lib/api';
import { CheckKeyData } from '../types';

interface KeyInspectorProps {
  initialKey?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const KeyInspector: React.FC<KeyInspectorProps> = ({
  initialKey = '',
  onClose,
  isModal = false,
}) => {
  const [inputKey, setInputKey] = useState(initialKey);
  const [loading, setLoading] = useState(false);
  const [keyData, setKeyData] = useState<CheckKeyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleInspect = async (tokenToTest?: string) => {
    const target = tokenToTest || inputKey;
    if (!target.trim()) {
      setError('Please enter a valid Opuszyra or Opuszen API key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await checkKey(target.trim());
      setKeyData(data);
      setCountdown(data.timeRemainingFormatted || '00:00:00');
    } catch (err: any) {
      setError(err.message || 'Key inspection failed. Please verify your token.');
      setKeyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount if initialKey provided
  useEffect(() => {
    if (initialKey) {
      handleInspect(initialKey);
    }
  }, []);

  // Live countdown timer ticking down continuously
  useEffect(() => {
    if (!keyData) return;

    let secLeft = keyData.secondsRemaining;
    if (keyData.window_resets_at) {
      const diff = Math.max(0, Math.floor((new Date(keyData.window_resets_at).getTime() - Date.now()) / 1000));
      if (diff > 0) secLeft = diff;
    }

    if (secLeft <= 0) {
      setCountdown('00:00:00');
      return;
    }

    const formatSeconds = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    setCountdown(formatSeconds(secLeft));

    const interval = setInterval(() => {
      secLeft -= 1;
      if (secLeft <= 0) {
        setCountdown('00:00:00');
        clearInterval(interval);
      } else {
        setCountdown(formatSeconds(secLeft));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [keyData]);

  const handleCopyKey = () => {
    if (!keyData?.key_token) return;
    navigator.clipboard.writeText(keyData.key_token);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyJson = () => {
    if (!keyData?.rawPayload) return;
    navigator.clipboard.writeText(JSON.stringify(keyData.rawPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleResetWindow = async () => {
    if (!keyData) return;
    try {
      setLoading(true);
      await resetKeyWindow(keyData.id);
      await handleInspect(keyData.key_token);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate window reset.');
    } finally {
      setLoading(false);
    }
  };

  const formatLocalTime = (isoString?: string) => {
    if (!isoString) return 'In ~5 hours';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const tokenLimitMillions = keyData ? (keyData.window_token_limit / 1_000_000).toFixed(2) : '0';
  const tokensUsedMillions = keyData ? (keyData.window_tokens_used / 1_000_000).toFixed(2) : '0';
  const tokensRemainingMillions = keyData ? (keyData.window_tokens_remaining / 1_000_000).toFixed(2) : '0';

  return (
    <div className={`w-full max-w-5xl mx-auto ${isModal ? '' : 'my-8 sm:my-12 px-2 sm:px-4'}`}>
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0d14] shadow-2xl p-5 sm:p-8 transition-colors">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                Opuszyra <span className="text-amber-500 dark:text-amber-400">Key Inspector</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
              Real-time inspection of 5-hour rolling quotas, live window countdowns, concurrency, and upstream throughput.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Gateway Active
            </span>
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
              placeholder="Enter your API token (e.g. sk-ant-opm-... or opm-live-5x-...)"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-white/15 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono text-xs sm:text-sm outline-none transition-all shadow-inner font-semibold"
            />
          </div>

          <button
            onClick={() => handleInspect()}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Querying...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Inspect Key</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Results Card */}
        {keyData && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.08] space-y-6">
            
            {/* Top Identity & Status Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{keyData.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {keyData.tier} Tier
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Realtime Upstream (api.opuszen.shop)</span>
                    </span>
                    {keyData.unlimited && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        Unlimited
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                    <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold bg-white dark:bg-dark-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-inner">
                      {keyData.masked_token}
                    </span>
                    <button
                      onClick={handleCopyKey}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition text-xs font-semibold"
                      title="Copy full key token"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-4 self-end md:self-center">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono font-bold">
                    Window Status
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{keyData.status} (Healthy)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleInspect(keyData.key_token)}
                  disabled={loading}
                  title="Re-query live upstream metrics"
                  className="p-2.5 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition shadow-sm cursor-pointer"
                >
                  <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* 4 Primary Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: 5-Hour Window Rolling Countdown */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      5-Hour Window Reset
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Rolling</span>
                  </div>
                  
                  {/* Digital Glowing Amber Countdown */}
                  <div className="text-3xl sm:text-4xl font-black font-mono text-amber-500 dark:text-amber-400 tracking-wider my-3 drop-shadow-sm">
                    {countdown}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Next Refresh:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatLocalTime(keyData.window_resets_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Usage older than 5 hours is continuously released back to quota.
                  </p>
                </div>
              </div>

              {/* Card 2: Window Token Quota */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      Window Quota
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {keyData.percentRemaining}% Available
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-dark-850 overflow-hidden my-3 p-0.5 border border-slate-300 dark:border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        keyData.percentUsed > 80
                          ? 'bg-rose-500'
                          : keyData.percentUsed > 50
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.max(4, keyData.percentUsed)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    <span>Used: {tokensUsedMillions}M</span>
                    <span>Cap: {tokenLimitMillions}M</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] text-xs flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining:</span>
                  <strong className="text-slate-900 dark:text-white font-mono font-bold">{tokensRemainingMillions}M tokens</strong>
                </div>
              </div>

              {/* Card 3: Concurrency & Rate Limits */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-500" />
                      Concurrency Limits
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">High-Bandwidth</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Rate Limit</div>
                      <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {keyData.rate_limit_rpm} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">RPM</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Throughput</div>
                      <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {(keyData.rate_limit_tpm / 1000).toFixed(0)}k <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">TPM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] text-xs flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Requests:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {keyData.total_requests} reqs ({keyData.last24hRequests ?? 0} in 24h)
                  </span>
                </div>
              </div>

              {/* Card 4: Credits & Prompt Caching */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-purple-500" />
                      Credits &amp; Caching
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-xs">0-Cost Cache</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-sm my-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Allocated Credits:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{keyData.allocatedCredits ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono mt-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining Credits:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{keyData.remainingCredits ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Prompt caching reads consume 0 tokens from your 5-hour allowance.
                </div>
              </div>

            </div>



            {/* Developer Raw JSON Payload Drawer */}
            <div className="rounded-2xl bg-slate-50 dark:bg-[#10131d] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-slate-100/80 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <span>View Raw Upstream Response (JSON Payload)</span>
                </div>
                {showRawJson ? <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              </button>

              {showRawJson && (
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/60">
                  <div className="flex justify-end mb-2.5">
                    <button
                      onClick={handleCopyJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.14] text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-sm transition"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans">JSON Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="font-sans">Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 scrollbar-thin shadow-inner">
                    {JSON.stringify(keyData.rawPayload || keyData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
