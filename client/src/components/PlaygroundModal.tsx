import React, { useState } from 'react';
import { X, Play, Terminal, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { streamClaudeMessage } from '../lib/api';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKey?: string;
}

const PLAYGROUND_MODELS = [
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-sonnet-5',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
];

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onClose,
  defaultKey = 'opm-live-5x-9f8a3c2e1b4d7f0a',
}) => {
  const [apiKey, setApiKey] = useState(defaultKey);
  const [model, setModel] = useState('claude-fable-5-1');
  const [prompt, setPrompt] = useState(
    'Write a concise TypeScript function demonstrating an unbuffered SSE streaming consumer for Claude models.'
  );
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [metrics, setMetrics] = useState<{
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  } | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStream = async () => {
    if (!prompt.trim()) return;
    setStreaming(true);
    setResponse('');
    setError('');
    setMetrics(null);

    await streamClaudeMessage({
      apiKey: apiKey.trim(),
      model,
      prompt,
      onChunk: (chunk) => {
        setResponse((prev) => prev + chunk);
      },
      onDone: (m) => {
        setMetrics(m);
        setStreaming(false);
      },
      onError: (err) => {
        setError(err);
        setStreaming(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-dark-900 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-dark-950/80">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Terminal className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Live Claude Playground (SSE Stream)</h2>
              <p className="text-xs text-slate-400">Direct streaming via Opuszyra Anthropic Proxy</p>
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
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Controls Bar */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-dark-950 px-3 py-2 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
              >
                {PLAYGROUND_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m} (1M window)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">API Key:</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-dark-950 px-3 py-2 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Prompt Box */}
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">Prompt:</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-dark-950 p-3 text-xs font-mono text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleStream}
              disabled={streaming}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              {streaming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming tokens...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Stream</span>
                </>
              )}
            </button>

            {metrics && (
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span>Input: {metrics.inputTokens} tok</span>
                <span>Output: {metrics.outputTokens} tok</span>
                <span className="text-emerald-400">Cache: {metrics.cachedTokens} tok (Free)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stream Output Window */}
          <div className="rounded-xl border border-white/[0.08] bg-dark-950 p-4 font-mono text-xs leading-relaxed min-h-[180px] max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${streaming ? 'bg-brand-500 animate-ping' : 'bg-emerald-500'}`}></span>
                <span>Output stream {streaming && '(receiving...)'}</span>
              </span>
              <span>SSE Pass-Through</span>
            </div>

            {response ? (
              <pre className="whitespace-pre-wrap text-slate-200">{response}</pre>
            ) : (
              <span className="text-slate-400 italic">Click "Execute Stream" to test real-time unbuffered token generation...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
