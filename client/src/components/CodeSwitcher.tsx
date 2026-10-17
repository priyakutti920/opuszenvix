import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
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
}`,
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

interface Token {
  text: string;
  className: string;
}

function tokenizeLine(line: string): Token[] {
  // If whole line is a comment:
  if (/^\s*(#|\/\/)/.test(line)) {
    return [{ text: line, className: 'text-slate-400 font-normal italic' }];
  }

  const tokens: Token[] = [];
  const regex = /(#.*$|\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|export|const|let|var|await|async|for|of|in|def|class|print|curl)\b|\b(?:npx\s+opuszyra|claude)\b|\b(?:true|false|null|\d+)\b|[A-Za-z0-9_.-]+(?=\s*:))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: line.slice(lastIndex, match.index),
        className: 'text-slate-100 font-normal',
      });
    }

    const val = match[0];
    if (val.startsWith('#') || val.startsWith('//')) {
      tokens.push({ text: val, className: 'text-slate-400 font-normal italic' });
    } else if (val.startsWith('"') || val.startsWith("'")) {
      const rest = line.slice(match.index + val.length);
      if (/^\s*:/.test(rest)) {
        tokens.push({ text: val, className: 'text-brand-300 font-medium' });
      } else {
        tokens.push({ text: val, className: 'text-amber-300 font-medium' });
      }
    } else if (/^(import|from|export|const|let|var|await|async|for|of|in|def|class|print|curl)$/.test(val)) {
      tokens.push({ text: val, className: 'text-sky-400 font-semibold' });
    } else if (/^(npx\s+opuszyra|claude)$/.test(val)) {
      tokens.push({ text: val, className: 'text-emerald-400 font-bold' });
    } else if (/^(true|false|null|\d+)$/.test(val)) {
      tokens.push({ text: val, className: 'text-purple-300 font-medium' });
    } else {
      tokens.push({ text: val, className: 'text-brand-300 font-medium' });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      text: line.slice(lastIndex),
      className: 'text-slate-100 font-normal',
    });
  }

  return tokens;
}

export const CodeSwitcher: React.FC = () => {
  const [activeTab, setActiveTab] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);

  const activeSnippet = SNIPPETS.find((s) => s.id === activeTab) || SNIPPETS[0];
  const lines = activeSnippet.code.split('\n');

  const handleCopy = async () => {
    const success = await copyToClipboard(activeSnippet.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.12] bg-[#0c0e14] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#07080d] px-3.5 sm:px-4 py-2.5 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 scrollbar-thin overflow-x-auto py-0.5">
          {SNIPPETS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium'
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
          className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors border border-white/10 shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Viewer Body */}
      <div className="relative p-4 sm:p-6 bg-[#07080d] font-mono text-xs sm:text-[13.5px] overflow-x-auto leading-6 sm:leading-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 text-xs pb-3 mb-4 border-b border-white/[0.06] gap-2 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
            <span className="text-slate-200 font-semibold">{activeSnippet.filename}</span>
          </div>
          <span className="text-brand-400 font-mono text-[11px] font-medium tracking-wide">
            Drop-in replacement for Anthropic SDK
          </span>
        </div>

        <div className="overflow-x-auto selection:bg-brand-500/30 selection:text-white">
          {lines.map((line, idx) => {
            const tokens = tokenizeLine(line);
            return (
              <div key={idx} className="flex min-w-0">
                <span className="select-none text-slate-600 text-right pr-4 w-7 sm:w-8 shrink-0 font-mono text-xs pt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1 whitespace-pre">
                  {tokens.map((token, tIdx) => (
                    <span key={tIdx} className={token.className}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
