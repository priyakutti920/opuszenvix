import React, { useState } from 'react';
import { Terminal, Send, Zap, Clock, ShieldCheck, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { streamClaudeMessage } from '../lib/api';

const MODELS = [
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', speed: 'Fast', tier: 'All Plans' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet v2', speed: 'Very Fast', tier: 'All Plans' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', speed: 'Deep Reasoning', tier: 'All Plans' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', speed: 'Ultra Fast', tier: 'All Plans' },
  { id: 'claude-fable-5-1', name: 'Claude Fable 5.1 (Community Model)', speed: 'Dynamic', tier: 'All Plans' },
];

const PRESETS = [
  'Explain how Opuszyra rolling 5-hour window differs from daily limits',
  'Write an async Python script using Anthropic SDK pointing to Opuszyra base URL',
  'How do prompt caching reads stay 100% free with Opuszyra proxy?',
];
interface PlaygroundProps {
  onOpenCheckout?: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ onOpenCheckout }) => {
  const [apiKey, setApiKey] = useState('opm-live-5x-9f8a3c2e1b4d7f0a');
  const [model, setModel] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState('Explain how Opuszyra rolling 5-hour window differs from daily limits');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    latencyMs: number;
  } | null>(null);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');
    setMetrics(null);

    const startTime = Date.now();

    await streamClaudeMessage({
      apiKey,
      model,
      prompt,
      onChunk: (chunk) => {
        setResponse((prev) => prev + chunk);
      },
      onDone: (m) => {
        setMetrics({
          ...m,
          latencyMs: Date.now() - startTime,
        });
        setLoading(false);
      },
      onError: (err) => {
        setError(err);
        setLoading(false);
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono mb-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>Interactive SSE Gateway Test Console</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Opuszyra <span className="text-gradient-orange">Live Playground</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Execute real-time streaming completions through the Anthropic-compatible proxy endpoint.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Prompt */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-dark-900/90 border border-white/10 backdrop-blur-xl space-y-4">
            {/* Key Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Opuszyra API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="opm-live-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/50 text-slate-200 font-mono text-xs outline-none transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Using default 5× test key. Quotas tracked in real-time.
              </span>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Target Claude Model
              </label>
              <div className="space-y-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      model === m.id
                        ? 'border-brand-500/50 bg-brand-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-dark-950/60 hover:bg-white/[0.03] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold font-mono">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.speed} • {m.id}</div>
                    </div>
                    {model === m.id && (
                      <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt presets */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Prompts
              </label>
              <div className="space-y-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(p)}
                    className="w-full text-left p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-xs text-slate-300 hover:text-white border border-white/5 transition-colors line-clamp-1"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Area */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Prompt
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your message to Claude..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/50 text-slate-200 text-xs sm:text-sm outline-none resize-none transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-amber-600 hover:from-brand-600 hover:to-amber-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Streaming Tokens...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Run Streaming Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Streaming Terminal & Metrics */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Metrics Header */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-dark-900/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Latency</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-cyan-400">
                {metrics ? `${metrics.latencyMs}ms` : '--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Input Tokens</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-white">
                {metrics ? metrics.inputTokens : '--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Output Tokens</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-brand-400">
                {metrics ? metrics.outputTokens : '--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Cache Read</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
                {metrics ? `${metrics.cachedTokens} ($0)` : 'Free'}
              </span>
            </div>
          </div>

          {/* Response Terminal */}
          <div className="flex-1 min-h-[420px] rounded-2xl bg-dark-950 border border-white/10 p-5 font-mono text-xs sm:text-sm flex flex-col justify-between overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Endpoint: /v1/messages</span>
                <span className="text-slate-600">•</span>
                <span className="text-brand-400">{model}</span>
              </div>
              <span>SSE Stream</span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 leading-relaxed">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {response ? (
                <div className="whitespace-pre-wrap text-slate-200">
                  {response}
                  {loading && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-1 align-middle"></span>}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-16">
                  <Terminal className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-xs">Select a prompt and click &quot;Run Streaming Request&quot;.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Tokens stream through Opuszyra proxy with zero-buffer SSE.</p>
                </div>
              )}
            </div>

            {/* Bottom Status */}
            <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Anthropic v1 format compatible
              </span>
              <span>Opuszyra Gateway v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
