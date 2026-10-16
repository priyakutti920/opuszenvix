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
  Server, 
  Activity, 
  Cpu, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Code2,
  CheckCircle2,
  Globe2,
  XCircle
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

    // Calculate seconds from reset target or stored secondsRemaining
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
      <div className="rounded-2xl border border-white/10 bg-dark-900/90 backdrop-blur-2xl shadow-2xl p-5 sm:p-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                Opuszyra <span className="text-amber-400">Key Inspector</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              Real-time inspection of 5-hour rolling quotas, live window countdowns, concurrency, and upstream throughput.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
              placeholder="Enter your API token (e.g. opm-live-5x-9f8a3c2e1b4d7f0a)"
              className="w-full px-4 py-3.5 rounded-xl bg-dark-950/80 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 text-slate-200 placeholder-slate-600 font-mono text-xs sm:text-sm outline-none transition-all shadow-inner"
            />
          </div>

          <button
            onClick={() => handleInspect()}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Querying...</span>
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
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Card */}
        {keyData && (
          <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-6">
            
            {/* Top Identity & Status Banner */}
            <div className="p-4 sm:p-5 rounded-xl bg-dark-950/80 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white font-mono">{keyData.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {keyData.tier} Tier
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Realtime Upstream (api.opuszen.shop)</span>
                    </span>
                    {keyData.unlimited && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Unlimited
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                    <span className="text-slate-300 font-mono bg-dark-900 px-2 py-0.5 rounded border border-white/5">
                      {keyData.masked_token}
                    </span>
                    <button
                      onClick={handleCopyKey}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition text-[11px]"
                      title="Copy full key token"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-sans">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="font-sans">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-3 self-end md:self-center">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Window Status
                  </div>
                  <div className="text-xs font-bold text-emerald-400 capitalize flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {keyData.status} (Healthy)
                  </div>
                </div>

                <button
                  onClick={() => handleInspect(keyData.key_token)}
                  disabled={loading}
                  title="Re-query live upstream metrics"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/10 transition cursor-pointer"
                >
                  <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* 4 Primary Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: 5-Hour Window Rolling Countdown */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      5-Hour Window Reset
                    </span>
                    <span className="text-amber-400 font-semibold text-[11px]">Rolling</span>
                  </div>
                  
                  <div className="text-3xl font-black font-mono text-white tracking-widest my-2 drop-shadow-md">
                    {countdown}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Next Refresh:</span>
                    <span className="font-mono text-slate-200">{formatLocalTime(keyData.window_resets_at)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Usage older than 5 hours is continuously released back to quota.
                  </p>
                </div>
              </div>

              {/* Card 2: Window Token Quota */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-brand-400" />
                      Window Quota
                    </span>
                    <span className="font-bold text-emerald-400 text-xs">
                      {keyData.percentRemaining}% Available
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-dark-850 overflow-hidden my-3 p-0.5 border border-white/5">
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

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Used: {tokensUsedMillions}M</span>
                    <span>Cap: {tokenLimitMillions}M</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04] text-[11px] text-slate-400 flex justify-between">
                  <span>Remaining:</span>
                  <strong className="text-slate-200 font-mono">{tokensRemainingMillions}M tokens</strong>
                </div>
              </div>

              {/* Card 3: Concurrency & Rate Limits */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Concurrency Limits
                    </span>
                    <span className="text-cyan-400 font-semibold text-[11px]">High-Bandwidth</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="p-2 rounded-xl bg-dark-900 border border-white/5">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Rate Limit</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {keyData.rate_limit_rpm} <span className="text-[10px] font-normal text-slate-400">RPM</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-dark-900 border border-white/5">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Throughput</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {(keyData.rate_limit_tpm / 1000).toFixed(0)}k <span className="text-[10px] font-normal text-slate-400">TPM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04] text-[11px] text-slate-400 flex justify-between">
                  <span>Total Requests:</span>
                  <span className="font-mono text-slate-200">
                    {keyData.total_requests} reqs ({keyData.last24hRequests ?? 0} in 24h)
                  </span>
                </div>
              </div>

              {/* Card 4: Credits & Prompt Caching */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-purple-400" />
                      Credits &amp; Caching
                    </span>
                    <span className="text-purple-400 font-semibold text-[11px]">0-Cost Cache</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 my-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Allocated Credits:</span>
                      <span className="font-bold text-white">{keyData.allocatedCredits ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono mt-1">
                      <span className="text-slate-400">Remaining Credits:</span>
                      <span className="font-bold text-emerald-400">{keyData.remainingCredits ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04] text-[10px] text-slate-500 leading-normal">
                  Prompt caching reads consume 0 tokens from your 5-hour allowance.
                </div>
              </div>

            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Authorized Models */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    Authorized Models with this Key
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(keyData.models_accessible || []).map((model) => (
                    <div
                      key={model}
                      className="px-3 py-2 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-xs text-slate-200 truncate">{model}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upstream Gateway Architecture */}
              <div className="p-5 rounded-2xl bg-dark-950/70 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    Gateway &amp; Architecture Matrix
                  </h4>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Upstream Host</span>
                    <span className="text-slate-200 font-semibold">api.opuszen.shop</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Provider Backend</span>
                    <span className="text-slate-200 font-semibold">
                      {(keyData.allowedProviders || ['opuslive']).join(', ')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Middle-Man Gateway</span>
                    <span className="text-emerald-400 font-semibold">Direct Streaming Bypass Enabled</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Developer Raw JSON Payload Drawer */}
            <div className="rounded-2xl bg-dark-950/60 border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white transition bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>View Raw Upstream Response (JSON Payload)</span>
                </div>
                {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRawJson && (
                <div className="p-4 border-t border-white/5 bg-black/40">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleCopyJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-sans">JSON Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="font-sans">Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-dark-950 border border-white/5 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-64 scrollbar-thin">
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
