import React, { useState, useEffect } from 'react';
import {
  Activity,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCw,
  Clock,
  Zap,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { fetchKeys, generateKey, deleteKey, resetKeyWindow, fetchLogs, fetchOverviewStats } from '../lib/api';
import { ApiKey, SystemStats, UsageLog } from '../types';
import { copyToClipboard } from '../lib/clipboard';

interface DashboardProps {
  onCheckKey?: (token: string) => void;
  onOpenInspectKey?: (token: string) => void;
  onOpenPlayground?: () => void;
  onOpenCheckout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCheckKey,
  onOpenInspectKey,
  onOpenPlayground,
  onOpenCheckout,
}) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyTier, setNewKeyTier] = useState<'5x' | '20x'>('5x');
  const [generating, setGenerating] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedKeys, fetchedLogs, fetchedStats] = await Promise.all([
        fetchKeys().catch(() => []),
        fetchLogs().catch(() => []),
        fetchOverviewStats().catch(() => null),
      ]);
      setKeys(fetchedKeys);
      setLogs(fetchedLogs);
      setStats(fetchedStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setGenerating(true);
      await generateKey(newKeyName.trim(), newKeyTier);
      setNewKeyName('');
      setShowGenerateModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create key');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await deleteKey(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete key');
    }
  };

  const handleResetWindow = async (id: string) => {
    try {
      await resetKeyWindow(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset window');
    }
  };

  const handleCopyKey = async (token: string, id: string) => {
    const success = await copyToClipboard(token);
    if (success) {
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Developer Management Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Opuszyra <span className="text-gradient-orange">Console Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your Anthropic proxy keys, monitor 5-hour rolling token buffers, and inspect live request streams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh Data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-600 hover:from-brand-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Key</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <Key className="w-4 h-4 text-brand-400" />
            <span>Active Keys</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{keys.length}</div>
          <span className="text-[11px] text-slate-500">Live proxy credentials</span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Tokens Consumed</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? (stats.totalTokens / 1_000_000).toFixed(2) : '0.00'}M
          </div>
          <span className="text-[11px] text-slate-500">Across all active keys</span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Total Requests</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {stats ? stats.totalRequests : 0}
          </div>
          <span className="text-[11px] text-slate-500">SSE streams &amp; messages</span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Proxy Health</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats ? stats.uptime : '99.98%'}
          </div>
          <span className="text-[11px] text-slate-500">Latency: {stats ? stats.gatewayLatencyMs : 19}ms</span>
        </div>
      </div>

      {/* Keys Management Section */}
      <div className="rounded-2xl border border-white/10 bg-dark-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-mono text-white">Your Opuszyra API Keys</h3>
            <p className="text-xs text-slate-400">Keys maintain individual 5-hour rolling limits and rate budgets.</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{keys.length} total keys</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-dark-950/60 font-mono text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Name / Key</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Window Used</th>
                <th className="py-3.5 px-4">5h Reset Timer</th>
                <th className="py-3.5 px-4">Rate Limits</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {keys.map((k) => {
                const isVisible = visibleKeyIds[k.id];
                const displayToken = isVisible
                  ? k.key_token
                  : `${k.key_token.slice(0, 16)}...${k.key_token.slice(-4)}`;

                return (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white font-mono text-xs sm:text-sm">{k.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-slate-400 select-all">{displayToken}</code>
                        <button
                          onClick={() => toggleVisibility(k.id)}
                          className="text-slate-500 hover:text-slate-300"
                          title={isVisible ? 'Hide token' : 'Reveal token'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopyKey(k.key_token, k.id)}
                          className="text-slate-500 hover:text-white"
                          title="Copy key"
                        >
                          {copiedKeyId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/25">
                        {k.tier}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <div className="w-32">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>{(k.window_tokens_used / 1_000_000).toFixed(2)}M</span>
                          <span>{(k.window_token_limit / 1_000_000).toFixed(0)}M</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-dark-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(4, Math.round((k.window_tokens_used / k.window_token_limit) * 100))
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{k.timeRemainingFormatted || '03:41:20'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-400">
                      <div>{k.rate_limit_rpm} RPM</div>
                      <div className="text-[10px] text-slate-500">{(k.rate_limit_tpm / 1000).toFixed(0)}k TPM</div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onCheckKey?.(k.key_token)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono"
                          title="Inspect in Key Checker"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleResetWindow(k.id)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white"
                          title="Reset window timer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Revoke key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Request Stream & Logs */}
      <div className="rounded-2xl border border-white/10 bg-dark-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Gateway Request Stream
            </h3>
            <p className="text-xs text-slate-400">Real-time log of completions, prompt cache hits, and latency.</p>
          </div>
          <button
            onClick={onOpenPlayground}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 transition-colors"
          >
            Launch Playground
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] bg-dark-950/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Tokens (In / Out)</th>
                <th className="py-3 px-4">Cache Read</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-6 text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{log.model}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.input_tokens} / {log.output_tokens}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {log.cached_tokens > 0 ? `${log.cached_tokens} (Free)` : '-'}
                  </td>
                  <td className="py-3 px-4 text-cyan-400">{log.latency_ms}ms</td>
                  <td className="py-3 px-6 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {log.status_code} OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-dark-900 border border-white/10 p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-bold font-mono text-white">Generate Opuszyra API Key</h3>
              <p className="text-xs text-slate-400 mt-1">
                Create a customized key token for your local IDE, CI/CD pipeline, or agent workflow.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Key Label / Name
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Cursor MacBook Pro or Claude Code Agent"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 focus:border-brand-500/60 text-slate-200 text-xs sm:text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Capacity Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKeyTier('5x')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newKeyTier === '5x'
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-white/10 bg-dark-950 text-slate-400'
                    }`}
                  >
                    <div className="font-bold font-mono text-xs">5× Everyday</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">25M tokens / 5h</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyTier('20x')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newKeyTier === '20x'
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-white/10 bg-dark-950 text-slate-400'
                    }`}
                  >
                    <div className="font-bold font-mono text-xs">20× Agentic</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">100M tokens / 5h</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-brand-500/20"
                >
                  {generating ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
