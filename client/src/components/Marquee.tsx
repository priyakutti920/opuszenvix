import React from 'react';
import { Terminal, Code, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

const INTEGRATIONS = [
  'Claude Code',
  'Cursor',
  'VS Code',
  'Windsurf',
  'Cline',
  'Roo Code',
  'Zed',
  'Anthropic SDK (Python)',
  'Anthropic SDK (TypeScript)',
  'LangChain & LlamaIndex',
];

export const Marquee: React.FC = () => {
  return (
    <section className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100/40 dark:bg-dark-900/40 py-5 overflow-hidden transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center max-w-7xl mx-auto px-4 sm:px-6">
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-mono">
          Works where you already work
        </p>

        <div className="flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]">
          <div className="flex w-max animate-marquee gap-8">
            {[...INTEGRATIONS, ...INTEGRATIONS].map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 whitespace-nowrap text-[13.5px] text-slate-500 dark:text-slate-400 font-mono"
              >
                <Terminal className="h-3.5 w-3.5 text-brand-500/80" />
                <span className="text-slate-800 dark:text-slate-200">{item}</span>
                <span className="ml-4 h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
