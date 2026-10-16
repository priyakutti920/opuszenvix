import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ChevronRight, 
  ArrowRight, 
  FileCode, 
  Globe, 
  Lock, 
  Clock, 
  RotateCw, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  Server, 
  Key, 
  Compass, 
  ArrowUpRight,
  Settings,
  Sliders,
  Share2
} from 'lucide-react';

interface DocsPageProps {
  onOpenPricing?: () => void;
  onOpenCheckUsage?: () => void;
}

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'gateway-guide', title: 'Gateway Architecture' },
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'ide-configuration', title: 'IDE Configuration' },
  { id: 'sdks-examples', title: 'SDKs & Code Examples' },
  { id: 'api-reference', title: 'API Reference' },
  { id: 'token-status-api', title: 'Token Status & Quota API' },
  { id: 'error-codes', title: 'Error Codes' },
  { id: 'built-in-tools', title: 'Built-in Tools' },
  { id: 'troubleshooting', title: 'Troubleshooting & FAQ' }
];

export const DocsPage: React.FC<DocsPageProps> = ({
  onOpenPricing,
  onOpenCheckUsage,
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [sdkTab, setSdkTab] = useState<'python' | 'typescript' | 'curl' | 'sse' | 'openai'>('python');

  const cleanDomain = 'https://api.opuszyra.live';
  const v1Base = `${cleanDomain}/v1`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-[#F5F2EB] transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-xs font-semibold text-[#EA580C] mb-4 shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Documentation &amp; AI Gateway</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
            <span className="text-[#EA580C]">Opuszyra</span> API &amp; Gateway Docs
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-base max-w-3xl leading-relaxed">
            High-performance Anthropic Claude &amp; OpenAI compatible AI API gateway with automatic passthrough bypass to the upstream inference engine, real-time token status inspections, and zero-latency SSE token streaming.
          </p>
        </div>



        {/* Layout: Sticky Navigation on Left + Docs Content on Right */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Sidebar Navigation */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1 bg-[#FDFCFB] dark:bg-[#121110] border border-[#E7E2D8] dark:border-[#262422] rounded-3xl p-4 shadow-sm" aria-label="Documentation navigation">
              <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider px-3 mb-3">
                Documentation Index
              </p>
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`block w-full text-left text-xs font-semibold px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EA580C] text-white shadow-md'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {sec.title}
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-[#E8E3D9] dark:border-[#262422] px-3 space-y-2">
                <a
                  href="#status"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = 'status';
                  }}
                  className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 hover:text-[#EA580C] transition-colors py-1 font-medium"
                >
                  <span>System Status</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </a>
                <button
                  onClick={onOpenCheckUsage}
                  className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 hover:text-[#EA580C] transition-colors py-1 w-full font-medium"
                >
                  <span>Check Key Usage</span>
                  <span className="text-[10px] font-mono text-stone-500">/usage</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Right Main Documentation Body */}
          <div className="flex-1 min-w-0 max-w-4xl space-y-16">
            
            {/* 1. OVERVIEW */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Overview
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 text-sm">
                Opuszyra is an ultra-low latency, Anthropic-compatible API gateway and proxy bypass system. It acts as an API gateway proxy forwarding requests seamlessly to the upstream inference engine. Developers can point their tools (Claude Code, Cursor, Windsurf, Cline, Roo Code, and official SDKs) directly to your gateway domain:{' '}
                <code className="text-xs font-mono bg-orange-500/10 text-[#EA580C] px-1.5 py-0.5 rounded font-bold border border-orange-500/20">
                  {v1Base}
                </code>.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    emoji: '🔀',
                    title: 'Direct Passthrough Bypass',
                    desc: 'Seamlessly forward /v1/messages, /v1/models, and /v1/chat/completions with zero buffering and low latency.'
                  },
                  {
                    emoji: '⚡',
                    title: 'Zero-Latency SSE Streaming',
                    desc: 'Real-time Server-Sent Events pass directly to the client with sub-20ms Time-To-First-Token (TTFT).'
                  },
                  {
                    emoji: '🔍',
                    title: 'Live Key Status Inspection',
                    desc: 'Integrated with upstream /api/key-status for real-time 5-hour rolling quotas, countdowns, and allowed models.'
                  },
                  {
                    emoji: '🌐',
                    title: 'High Availability Gateway',
                    desc: 'Connect directly to https://api.opuszyra.live with ultra-reliable routing, zero buffering, and 99.9% uptime.'
                  },
                  {
                    emoji: '💰',
                    title: 'Prompt Caching Enabled',
                    desc: 'Anthropic prompt cache read tokens pass through without extra charges, accelerating large context windows.'
                  },
                  {
                    emoji: '🛡️',
                    title: '5-Hour Rolling Budget Protection',
                    desc: 'Continuous quota replenishment prevents over-budget spikes with automatic reset countdowns.'
                  }
                ].map((card, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#121110] hover:border-[#EA580C]/50 transition-all shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{card.emoji}</span>
                      <span className="text-sm font-bold">{card.title}</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. GATEWAY ARCHITECTURE */}
            <section id="gateway-guide" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                API Gateway Architecture
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 text-sm">
                When you deploy Opuszyra, you become the authoritative API gateway for your users. Clients send requests to your domain (<code className="font-mono text-[#EA580C]">{cleanDomain}</code>), and your server handles authentication, quota validation, and forwards traffic seamlessly to the upstream inference provider.
              </p>

              {/* Architecture Diagram Box */}
              <div className="p-6 rounded-3xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#121110] mb-8 shadow-sm">
                <div className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Request Flow Pipeline</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#262422] bg-stone-50 dark:bg-[#181716] text-center">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#EA580C] flex items-center justify-center mx-auto mb-2">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Your Developer / Client</div>
                    <div className="text-[11px] text-stone-500 font-mono mt-1">Cursor • Claude Code • Python • TS</div>
                    <div className="mt-2 text-[10px] text-[#EA580C] font-mono break-all bg-orange-500/5 p-1 rounded">
                      Base URL: {cleanDomain}/v1
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-orange-500/40 bg-orange-500/[0.05] text-center relative">
                    <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                      <Server className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-[#EA580C]">Your Gateway Server</div>
                    <div className="text-[11px] text-stone-500 font-mono mt-1">{cleanDomain}</div>
                    <div className="mt-2 text-[10px] text-stone-400">
                      • Auth &amp; Key Verification<br />
                      • 5-Hour Rolling Metering<br />
                      • Passthrough Streaming (SSE)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#262422] bg-stone-50 dark:bg-[#181716] text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Upstream Engine</div>
                    <div className="text-[11px] text-stone-500 font-mono mt-1">Upstream Gateway</div>
                    <div className="mt-2 text-[10px] text-emerald-500 font-mono bg-emerald-500/5 p-1 rounded">
                      Claude 3.7 / 3.5 / 4 / 5 Models
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment Variables Configuration Guide */}
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#EA580C]" />
                <span>Configuring Your Gateway Server (.env)</span>
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                In your backend server directory (<code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">server/.env</code>), configure the upstream URL and your public gateway domain:
              </p>

              <div className="dark-code-box relative group rounded-2xl border border-[#262320] bg-[#0F0E0D] overflow-hidden mb-6 shadow-md">
                <div className="px-4 py-2 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                  <span>server/.env</span>
                  <button
                    onClick={() => copyToClipboard(`PORT=5000\nAPI_DOMAIN=${cleanDomain}\nUPSTREAM_API_BASE=https://api.upstream-service.com\nUPSTREAM_API_KEY=`, 'env-file-snippet')}
                    className="flex items-center gap-1 text-stone-400 hover:text-white transition"
                  >
                    {copiedSnippetId === 'env-file-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'env-file-snippet' ? 'Copied' : 'Copy .env'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                  <code>{`PORT=5000
API_DOMAIN=${cleanDomain}
UPSTREAM_API_BASE=https://api.upstream-service.com
UPSTREAM_API_KEY=`}</code>
                </pre>
              </div>

              {/* Nginx & Reverse Proxy Setup */}
              <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#121110]">
                <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-2">
                  Pointing Your Domain (Nginx &amp; Cloudflare)
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                  To map <code className="font-mono text-[#EA580C]">{cleanDomain}</code> to your running Node.js server on port 5000 with SSE streaming support, enable proxy buffering off:
                </p>
                <pre className="p-3 rounded-xl bg-black/60 text-stone-200 font-mono text-xs overflow-x-auto">
                  <code>{`server {
    server_name ${cleanDomain.replace(/https?:\/\//, '')};

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</code>
                </pre>
              </div>
            </section>

            {/* 3. QUICK START */}
            <section id="quick-start" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Quick Start
              </h2>

              {/* 1-Step CLI Setup Card */}
              <div className="p-6 rounded-3xl border-2 border-orange-500/30 bg-orange-500/[0.04] mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#EA580C] text-white px-2.5 py-1 rounded-lg">Recommended</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white">1-Step CLI Setup</span>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">Zero config needed</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                  Run the official setup command in your terminal. It automatically configures Claude Code CLI, Cursor, and your shell environment:
                </p>

                <div className="dark-code-box relative group rounded-2xl border border-[#262320] bg-[#0F0E0D] overflow-hidden shadow-md">
                  <div className="px-4 py-2 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                    <span>terminal</span>
                    <button
                      onClick={() => copyToClipboard('npx opuszyra', 'cli-quickstart')}
                      className="flex items-center gap-1 text-stone-400 hover:text-white transition"
                    >
                      {copiedSnippetId === 'cli-quickstart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippetId === 'cli-quickstart' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                    <code>npx opuszyra</code>
                  </pre>
                </div>
              </div>

              <h3 className="text-base font-bold mb-3">Manual Environment Variables</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                Alternatively, configure your environment variables manually to point directly to your Opuszyra gateway:
              </p>

              <div className="dark-code-box relative group rounded-2xl border border-[#262320] bg-[#0F0E0D] overflow-hidden mb-6 shadow-md">
                <div className="px-4 py-2 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                  <span>bash</span>
                  <button
                    onClick={() => copyToClipboard(`export ANTHROPIC_BASE_URL="${v1Base}"\nexport ANTHROPIC_API_KEY="YOUR_API_KEY"`, 'env-quickstart')}
                    className="flex items-center gap-1 text-stone-400 hover:text-white transition"
                  >
                    {copiedSnippetId === 'env-quickstart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'env-quickstart' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                  <code>{`export ANTHROPIC_BASE_URL="${v1Base}"\nexport ANTHROPIC_API_KEY="YOUR_API_KEY"`}</code>
                </pre>
              </div>
            </section>

            {/* 4. IDE CONFIGURATION */}
            <section id="ide-configuration" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                IDE Configuration
              </h2>

              {/* Claude Code CLI */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-[#EA580C] text-white px-2.5 py-1 rounded-lg">Claude Code</span>
                  <span className="text-xs text-stone-500">Official CLI &amp; VS Code Extension</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                  Add or edit your settings file located at <code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1.5 py-0.5 rounded">~/.claude/settings.json</code>:
                </p>
                <div className="dark-code-box relative group rounded-2xl border border-[#262320] bg-[#0F0E0D] overflow-hidden shadow-md">
                  <div className="px-4 py-2 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                    <span>json</span>
                    <button
                      onClick={() => copyToClipboard(`{\n  "env": {\n    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",\n    "ANTHROPIC_BASE_URL": "${cleanDomain}",\n    "ANTHROPIC_MODEL": "claude-opus-4-8",\n    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",\n    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"\n  },\n  "hasCompletedOnboarding": true\n}`, 'claude-settings')}
                      className="flex items-center gap-1 text-stone-400 hover:text-white transition"
                    >
                      {copiedSnippetId === 'claude-settings' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippetId === 'claude-settings' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                    <code>{`{\n  "env": {\n    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",\n    "ANTHROPIC_BASE_URL": "${cleanDomain}",\n    "ANTHROPIC_MODEL": "claude-opus-4-8",\n    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",\n    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"\n  },\n  "hasCompletedOnboarding": true\n}`}</code>
                  </pre>
                </div>
              </div>

              {/* Cursor */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold border border-[#E7E2D8] dark:border-[#262422] text-[#EA580C] bg-orange-500/10 px-2.5 py-1 rounded-lg">Cursor</span>
                  <span className="text-xs text-stone-500">Settings → Models → OpenAI / Anthropic</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                  In Cursor Settings (<code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">Ctrl+,</code> or <code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">Cmd+,</code>) under <strong>Models</strong>:
                </p>
                <div className="space-y-2 text-xs font-mono mb-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                    <span className="text-stone-500 w-28 shrink-0">Base URL</span>
                    <code className="text-[#EA580C] font-bold">{v1Base}</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                    <span className="text-stone-500 w-28 shrink-0">API Key</span>
                    <code className="text-stone-400">YOUR_API_KEY</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                    <span className="text-stone-500 w-28 shrink-0">Model Names</span>
                    <code className="text-[#EA580C] font-bold">claude-opus-4-8, claude-sonnet-4-6, claude-3-7-sonnet-20250219</code>
                  </div>
                </div>
              </div>

              {/* Windsurf & Cline */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#EA580C]">Windsurf</span>
                    <span className="text-[11px] text-stone-400">Codeium AI Editor</span>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">Custom Anthropic Base URL:</p>
                  <code className="dark-code-box block p-2.5 rounded-lg bg-black/60 text-white font-mono text-xs select-all">
                    {v1Base}
                  </code>
                </div>

                <div className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#EA580C]">Cline / Roo Code</span>
                    <span className="text-[11px] text-stone-400">VS Code Extension</span>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">Select Provider <strong>Anthropic</strong>:</p>
                  <code className="dark-code-box block p-2.5 rounded-lg bg-black/60 text-white font-mono text-xs select-all">
                    {v1Base}
                  </code>
                </div>
              </div>
            </section>

            {/* 5. SDKS & CODE EXAMPLES */}
            <section id="sdks-examples" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                SDKs &amp; Code Examples
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 text-xs sm:text-sm">
                Opuszyra is fully compatible with standard Anthropic and OpenAI SDKs. Requests are routed through <code className="font-mono text-[#EA580C]">{v1Base}</code>.
              </p>

              {/* Code Tab Switcher */}
              <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312] mb-4">
                {[
                  { key: 'python', label: 'Python (Anthropic)' },
                  { key: 'typescript', label: 'TypeScript / Node.js' },
                  { key: 'curl', label: 'cURL' },
                  { key: 'sse', label: 'Streaming (SSE)' },
                  { key: 'openai', label: 'OpenAI SDK' }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSdkTab(t.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sdkTab === t.key
                        ? 'bg-[#EA580C] text-white shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Code Block by Tab */}
              <div className="dark-code-box relative group rounded-3xl border border-[#262320] bg-[#0F0E0D] overflow-hidden shadow-2xl">
                <div className="px-5 py-3 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                  <span>{sdkTab === 'curl' ? 'bash' : sdkTab}</span>
                  <button
                    onClick={() => {
                      const snippet = sdkTab === 'python'
                        ? `import anthropic\n\nclient = anthropic.Anthropic(\n    api_key="YOUR_API_KEY",\n    base_url="${cleanDomain}",\n)\n\nmessage = client.messages.create(\n    model="claude-opus-4-8",\n    max_tokens=1024,\n    messages=[{"role": "user", "content": "Explain quantum computing in one paragraph."}],\n)\n\nprint(message.content[0].text)`
                        : sdkTab === 'typescript'
                        ? `import Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({\n  apiKey: 'YOUR_API_KEY',\n  baseURL: '${cleanDomain}',\n});\n\nconst response = await anthropic.messages.create({\n  model: 'claude-sonnet-4-6',\n  max_tokens: 1024,\n  messages: [{ role: 'user', content: 'Write a TypeScript quicksort.' }],\n});\n\nconsole.log(response.content[0]);`
                        : sdkTab === 'curl'
                        ? `curl ${v1Base}/messages \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '{\n    "model": "claude-opus-4-8",\n    "max_tokens": 1024,\n    "messages": [{"role": "user", "content": "Hello via Opuszyra!"}]\n  }'`
                        : sdkTab === 'sse'
                        ? `import anthropic\n\nclient = anthropic.Anthropic(api_key="YOUR_API_KEY", base_url="${cleanDomain}")\n\nwith client.messages.stream(\n    max_tokens=1024,\n    messages=[{"role": "user", "content": "Write an essay about AI autonomous swarms."}],\n    model="claude-sonnet-4-6",\n) as stream:\n    for text in stream.text_stream:\n        print(text, end="", flush=True)`
                        : `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="YOUR_API_KEY",\n    base_url="${v1Base}",\n)\n\nresponse = client.chat.completions.create(\n    model="claude-sonnet-4-6",\n    messages=[{"role": "user", "content": "Hello from OpenAI SDK via Opuszyra!"}],\n)\nprint(response.choices[0].message.content)`;
                      copyToClipboard(snippet, `sdk-${sdkTab}`);
                    }}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-white transition"
                  >
                    {copiedSnippetId === `sdk-${sdkTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === `sdk-${sdkTab}` ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-5 text-xs sm:text-sm font-mono text-white leading-relaxed overflow-x-auto">
                  {sdkTab === 'python' && (
                    <code>{`import anthropic

# Initialize the client pointing to your Opuszyra Gateway
client = anthropic.Anthropic(
    api_key="YOUR_API_KEY",
    base_url="${cleanDomain}",
)

message = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Explain quantum computing in one paragraph."}
    ],
)

print(message.content[0].text)`}</code>
                  )}

                  {sdkTab === 'typescript' && (
                    <code>{`import Anthropic from '@anthropic-ai/sdk';

// Initialize the client pointing to your Opuszyra Gateway
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY',
  baseURL: '${cleanDomain}',
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Write a TypeScript quicksort algorithm.' }],
});

console.log(response.content[0]);`}</code>
                  )}

                  {sdkTab === 'curl' && (
                    <code>{`curl ${v1Base}/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-4-8",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello from raw cURL via Opuszyra!" }
    ]
  }'`}</code>
                  )}

                  {sdkTab === 'sse' && (
                    <code>{`import anthropic

client = anthropic.Anthropic(
    api_key="YOUR_API_KEY", 
    base_url="${cleanDomain}"
)

# Unbuffered real-time SSE stream pass-through
with client.messages.stream(
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write an essay about AI autonomous swarms."}],
    model="claude-sonnet-4-6",
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`}</code>
                  )}

                  {sdkTab === 'openai' && (
                    <code>{`from openai import OpenAI

# OpenAI SDK directed to your Opuszyra Gateway
client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${v1Base}",
)

response = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Hello from OpenAI SDK via Opuszyra!"}],
)

print(response.choices[0].message.content)`}</code>
                  )}
                </pre>
              </div>
            </section>

            {/* 6. API REFERENCE */}
            <section id="api-reference" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                API Reference
              </h2>

              <div className="mb-6 p-5 rounded-2xl border border-[#EA580C]/30 bg-orange-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-1">Your Gateway Base URL</span>
                  <code className="text-base font-mono font-bold text-stone-900 dark:text-white bg-white/50 dark:bg-black/50 px-2.5 py-1 rounded border border-orange-500/20 select-all">
                    {cleanDomain}
                  </code>
                </div>
                <div className="text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-[#EA580C] font-semibold border border-orange-500/20">
                    Upstream: Connected &amp; Active
                  </span>
                  <p className="mt-1 text-[11px]">Supports both /v1/ and /api/v1/ endpoints</p>
                </div>
              </div>

              {/* Endpoints List */}
              <div className="space-y-6">
                
                {/* Endpoint 1 */}
                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#EA580C] text-white">POST</span>
                      <code className="text-sm font-mono font-bold text-stone-900 dark:text-white">/v1/messages</code>
                    </div>
                    <code className="text-xs font-mono text-[#EA580C] bg-orange-500/10 px-2 py-0.5 rounded select-all">{v1Base}/messages</code>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">Create a message completion. Supports text generation, multi-turn chat, system prompts, vision, and real-time SSE streaming.</p>
                  
                  <div className="dark-code-box relative group rounded-xl border border-[#262320] bg-[#0F0E0D] overflow-hidden">
                    <pre className="p-3 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                      <code>{`{\n  "model": "claude-opus-4-8",\n  "max_tokens": 1024,\n  "messages": [\n    { "role": "user", "content": "Hello, Claude!" }\n  ],\n  "stream": false\n}`}</code>
                    </pre>
                  </div>
                </div>

                {/* Endpoint 2 */}
                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono">GET</span>
                      <code className="text-sm font-mono font-bold text-stone-900 dark:text-white">/v1/models</code>
                    </div>
                    <code className="text-xs font-mono text-[#EA580C] bg-orange-500/10 px-2 py-0.5 rounded select-all">{v1Base}/models</code>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">List all active models retrieved directly from the upstream engine (Claude Fable 5.1, Claude Opus 5.5, Claude Sonnet 5, Claude Opus 4.8, 4.7, 4.6, 4.5, etc.).</p>
                </div>

                {/* Endpoint 3 */}
                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#EA580C] text-white">POST</span>
                      <code className="text-sm font-mono font-bold text-stone-900 dark:text-white">/v1/chat/completions</code>
                    </div>
                    <code className="text-xs font-mono text-[#EA580C] bg-orange-500/10 px-2 py-0.5 rounded select-all">{v1Base}/chat/completions</code>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">OpenAI-compatible chat completion endpoint. Seamless drop-in for OpenAI client libraries.</p>
                </div>

                {/* Endpoint 4 */}
                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono">GET</span>
                      <code className="text-sm font-mono font-bold text-stone-900 dark:text-white">/api/status</code>
                    </div>
                    <code className="text-xs font-mono text-[#EA580C] bg-orange-500/10 px-2 py-0.5 rounded select-all">{cleanDomain}/api/status</code>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">System health &amp; upstream latency status. Reports operational status of proxy routing, gateway latency, and cluster nodes.</p>
                </div>

              </div>
            </section>

            {/* 7. TOKEN STATUS & QUOTA API */}
            <section id="token-status-api" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Token Status &amp; Quota API
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 text-sm">
                Inspect API key balances, remaining tokens in the 5-hour rolling window, countdown to quota reset, allowed models, and real-time connectivity status. Queries the upstream engine directly.
              </p>

              {/* Endpoint Specification */}
              <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312] mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#EA580C] text-white">POST</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">GET</span>
                    <code className="text-sm font-mono font-bold text-stone-900 dark:text-white">/api/key-status</code>
                  </div>
                  <code className="text-xs font-mono text-[#EA580C] bg-orange-500/10 px-2 py-0.5 rounded select-all">{cleanDomain}/api/key-status</code>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Pass your key via JSON body <code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">{`{ "key": "..." }`}</code>, Query parameter <code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">?key=YOUR_KEY</code>, or Header <code className="font-mono bg-stone-100 dark:bg-[#1A1918] px-1 py-0.5 rounded">Authorization: Bearer YOUR_KEY</code>.
                </p>

                {/* Example Request Snippet */}
                <div className="dark-code-box relative group rounded-xl border border-[#262320] bg-[#0F0E0D] overflow-hidden mb-4">
                  <div className="px-4 py-2 border-b border-[#262320] text-xs font-mono text-[#EA580C] bg-[#141312] font-semibold flex items-center justify-between">
                    <span>cURL Request</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST ${cleanDomain}/api/key-status \\\n  -H "Content-Type: application/json" \\\n  -d '{"key": "opm-live-5x-9f8a3c2e1b4d7f0a"}'`, 'curl-key-status')}
                      className="flex items-center gap-1 text-stone-400 hover:text-white transition"
                    >
                      {copiedSnippetId === 'curl-key-status' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippetId === 'curl-key-status' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-white leading-relaxed overflow-x-auto">
                    <code>{`curl -X POST ${cleanDomain}/api/key-status \\
  -H "Content-Type: application/json" \\
  -d '{"key": "opm-live-5x-9f8a3c2e1b4d7f0a"}'`}</code>
                  </pre>
                </div>

                {/* Example Response Schema */}
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">Example JSON Response:</div>
                <div className="dark-code-box relative group rounded-xl border border-[#262320] bg-[#0F0E0D] overflow-hidden">
                  <pre className="p-4 text-xs font-mono text-stone-300 leading-relaxed overflow-x-auto">
                    <code>{`{
  "status": "ok",
  "isRealtime": true,
  "keyStatus": "active",
  "name": "API Key",
  "connectionStatus": "Online",
  "windowTokensLimit": 10000000,
  "windowTokensUsed": 0,
  "remainingTokens": 10000000,
  "usagePercent": 0,
  "windowResetAt": "2026-10-16T15:45:00.000Z",
  "rateLimit": 60,
  "totalRequests": 0,
  "allowedModels": [
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001"
  ],
  "key": {
    "key_token": "opm-live-5x-9f8a3c2e1b4d7f0a",
    "masked_token": "opm-live-5x-9f...7f0a",
    "tier": "5x",
    "percentRemaining": 100,
    "timeRemainingFormatted": "04:59:12",
    "secondsRemaining": 17952
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </section>

            {/* 8. ERROR CODES */}
            <section id="error-codes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Error Codes &amp; Status
              </h2>

              <div className="border border-[#E7E2D8] dark:border-[#262422] rounded-3xl overflow-hidden bg-[#FDFCFB] dark:bg-[#121110] shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-[#181716] border-b border-[#E8E3D9] dark:border-[#262422]">
                      <th className="text-left px-5 py-3 font-bold w-28">Status</th>
                      <th className="text-left px-5 py-3 font-bold w-40">Error Name</th>
                      <th className="text-left px-5 py-3 font-bold">Meaning &amp; Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3D9] dark:divide-[#262422]">
                    <tr>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">200 OK</td>
                      <td className="px-5 py-3.5 font-semibold">Success</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">Request completed successfully or SSE streaming initiated.</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">400 Bad Request</td>
                      <td className="px-5 py-3.5 font-semibold">invalid_request</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">Malformed JSON or unsupported parameter structure.</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">401 Unauthorized</td>
                      <td className="px-5 py-3.5 font-semibold">authentication_error</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">Invalid or missing API key. Verify key in Check Usage page.</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">429 Rate Limit</td>
                      <td className="px-5 py-3.5 font-semibold">rate_limit_error</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">5-hour rolling window reached limit. Check reset countdown timer.</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">502 Gateway</td>
                      <td className="px-5 py-3.5 font-semibold">api_error</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">Upstream provider error connecting to upstream service. Check server logs.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 9. BUILT-IN TOOLS */}
            <section id="built-in-tools" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Built-in Tools
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-6 text-xs sm:text-sm">
                Web search and image analysis are available directly on the gateway server — no client-side MCP configuration or extra API keys required.
              </p>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🔍</span>
                    <h3 className="text-sm font-bold">Web Search Tool</h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">Real-time web search powered by the gateway:</p>
                  <code className="dark-code-box block p-2 rounded-lg bg-black/60 text-white font-mono text-xs mb-2 select-all">
                    POST {cleanDomain}/tools/web_search
                  </code>
                  <pre className="dark-code-box p-3 rounded-lg bg-black/40 text-stone-300 font-mono text-xs overflow-x-auto">
                    <code>{`{ "query": "latest Anthropic Claude release notes" }`}</code>
                  </pre>
                </div>

                <div className="p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🖼️</span>
                    <h3 className="text-sm font-bold">Multimodal Image Analysis</h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">Inspect image files via HTTP URL or base64-encoded payload (supports JPEG, PNG, WebP up to 18MB):</p>
                  <code className="dark-code-box block p-2 rounded-lg bg-black/60 text-white font-mono text-xs mb-2 select-all">
                    POST {cleanDomain}/tools/understand_image
                  </code>
                  <pre className="dark-code-box p-3 rounded-lg bg-black/40 text-stone-300 font-mono text-xs overflow-x-auto">
                    <code>{`{ "image": "https://example.com/screenshot.png", "prompt": "Describe this UI screenshot" }`}</code>
                  </pre>
                </div>
              </div>
            </section>

            {/* 10. TROUBLESHOOTING & FAQ */}
            <section id="troubleshooting" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 pb-3 border-b border-[#E8E3D9] dark:border-[#262422] flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[#EA580C]" />
                Troubleshooting &amp; FAQ
              </h2>

              <div className="space-y-3 mb-8">
                {[
                  {
                    q: 'Connection or CORS errors in Cursor / Windsurf',
                    a: `Make sure the Base URL ends in /v1 (e.g. ${v1Base}). Restart your editor after saving the configuration.`
                  },
                  {
                    q: '401 Unauthorized / Invalid API Key',
                    a: 'Verify your key on the Check Usage page (/usage) or via /api/key-status. Ensure there are no leading or trailing whitespace characters.'
                  },
                  {
                    q: 'Rate Limit Exceeded (HTTP 429)',
                    a: 'Your 5-hour rolling token window has reached capacity. Check remaining seconds on the Check Usage page or wait for the countdown timer.'
                  },
                  {
                    q: 'How does Direct Passthrough bypass work?',
                    a: 'Your server receives requests on /v1/messages, validates key/tokens, and streams directly to the upstream engine with zero buffering.'
                  },
                  {
                    q: 'Can I use a master upstream key for all my users?',
                    a: 'Yes! Set UPSTREAM_API_KEY in your server/.env file. Your server will automatically authenticate with the upstream provider while distributing custom keys to your clients.'
                  }
                ].map((faq, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#262422] bg-[#FDFCFB] dark:bg-[#141312]">
                    <p className="text-xs font-bold text-stone-900 dark:text-white mb-1">{faq.q}</p>
                    <p className="text-xs text-stone-500 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>

              {/* Bottom Support Callout */}
              <div className="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-center">
                <h3 className="text-base font-bold text-[#EA580C] mb-1">
                  Ready to test your Opuszyra Gateway?
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                  Check live token usage, test streaming completions, or verify system health.
                </p>
                <div className="inline-flex items-center gap-3">
                  <a
                    href="#status"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = 'status';
                    }}
                    className="px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-bold hover:bg-[#D94E0A] transition shadow-md"
                  >
                    View Gateway Status
                  </a>
                  <button
                    onClick={onOpenCheckUsage}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#141312] border border-[#E7E2D8] dark:border-[#262422] text-xs font-bold transition hover:bg-stone-50 dark:hover:bg-white/5"
                  >
                    Check Key Balance
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};
