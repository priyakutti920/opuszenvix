import React, { useState } from 'react';
import { Check, Copy, Terminal, Code, Cpu, Sparkles } from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

const SNIPPETS = [
  {
    id: 'setup',
    name: '1-Step Setup CLI',
    lang: 'bash',
    filename: 'terminal.sh',
    code: `# Instant 1-step interactive configuration
npx opuszyra

# Automatically configures Claude Code, Cursor, and shell environments
# with https://api.opuszyra.live/v1 and your key!`,
  },
  {
    id: 'claudecode',
    name: 'Claude Code CLI',
    lang: 'bash',
    filename: 'terminal.sh',
    code: `# Auto-configure via CLI:
npx opuszyra

# Or export manually:
export ANTHROPIC_BASE_URL="https://api.opuszyra.live/v1"
export ANTHROPIC_API_KEY="opm-live-5x-your_api_key_here"

# Run Claude Code with full 5-hour rolling capacity
claude`,
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    lang: 'json',
    filename: '.cursorrules / settings.json',
    code: `// In Cursor > Settings > Models > OpenAI/Anthropic API Key
{
  "anthropic.overrideBaseUrl": "https://api.opuszyra.live/v1",
  "anthropic.apiKey": "opm-live-20x-your_api_key_here",
  "defaultModel": "claude-3-7-sonnet-20250219"
}`,
  },
  {
    id: 'python',
    name: 'Python SDK',
    lang: 'python',
    filename: 'opus_client.py',
    code: `import anthropic

client = anthropic.Anthropic(
    api_key="opm-live-5x-your_api_key_here",
    base_url="https://api.opuszyra.live/v1"  # Drop-in Opuszyra proxy
)

response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Analyze system architecture"}]
)

print(response.content[0].text)`,
  },
  {
    id: 'typescript',
    name: 'TypeScript / Node.js',
    lang: 'typescript',
    filename: 'client.ts',
    code: `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'opm-live-20x-your_api_key_here',
  baseURL: 'https://api.opuszyra.live/v1', // Unbuffered SSE streaming
});

const stream = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Draft migration plan' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta?.text || '');
} `,
  },
  {
    id: 'windsurf',
    name: 'Windsurf / Cline',
    lang: 'json',
    filename: 'cline_config.json',
    code: `{
  "apiProvider": "anthropic",
  "apiModelId": "claude-3-7-sonnet-20250219",
  "anthropicBaseUrl": "https://api.opuszyra.live/v1",
  "apiKey": "opm-live-5x-your_api_key_here"
}`,
  },
  {
    id: 'curl',
    name: 'cURL',
    lang: 'bash',
    filename: 'request.sh',
    code: `curl https://api.opuszyra.live/v1/messages \\
  -H "content-type: application/json" \\
  -H "x-api-key: opm-live-5x-your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello via Opuszyra!"}]
  }'`,
  },
];

export const CodeSwitcher: React.FC = () => {
  const [activeTab, setActiveTab] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);

  const activeSnippet = SNIPPETS.find((s) => s.id === activeTab) || SNIPPETS[0];

  const handleCopy = async () => {
    const success = await copyToClipboard(activeSnippet.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-dark-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-dark-950/60 px-4 py-2.5 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 scrollbar-none">
          {SNIPPETS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleCopy}
          aria-label={`Copy ${activeSnippet.name} code`}
          title={`Copy ${activeSnippet.name} code`}
          className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors border border-white/10 shrink-0 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Viewer Body */}
      <div className="dark-code-box relative p-4 sm:p-5 bg-dark-950/80 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed text-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 text-[11px] pb-3 mb-3 border-b border-white/[0.04] gap-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500/40 inline-block"></span>
            {activeSnippet.filename}
          </span>
          <span className="text-brand-500/80 font-medium">Drop-in replacement for Anthropic SDK</span>
        </div>
        <pre className="text-slate-200 overflow-x-auto font-mono selection:bg-brand-500/30">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
};
