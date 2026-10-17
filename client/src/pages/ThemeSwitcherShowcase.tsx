import React, { useState } from 'react';
import { LiquidGlassThemeSwitcher, LiquidTheme } from '../components/LiquidGlassThemeSwitcher';
import { Sparkles, Layers, Sliders, Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

interface ThemeSwitcherShowcaseProps {
  currentTheme?: LiquidTheme;
  onThemeChange?: (theme: LiquidTheme) => void;
}

export const ThemeSwitcherShowcase: React.FC<ThemeSwitcherShowcaseProps> = ({
  currentTheme = 'dark',
  onThemeChange,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<LiquidTheme>(currentTheme);
  const [bgStyle, setBgStyle] = useState<'aurora' | 'sunset' | 'cyber' | 'dark'>('aurora');
  const [copied, setCopied] = useState(false);

  const handleSelectTheme = (theme: LiquidTheme) => {
    setSelectedTheme(theme);
    onThemeChange?.(theme);
  };

  const bgStyles = {
    aurora: `
      radial-gradient(circle at 25% 25%, rgba(244, 63, 94, 0.75) 0%, transparent 45%),
      radial-gradient(circle at 75% 30%, rgba(56, 189, 248, 0.85) 0%, transparent 45%),
      radial-gradient(circle at 50% 70%, rgba(168, 85, 247, 0.8) 0%, transparent 45%),
      radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.7) 0%, transparent 40%)
    `,
    sunset: `
      radial-gradient(circle at 30% 30%, rgba(249, 115, 22, 0.85) 0%, transparent 45%),
      radial-gradient(circle at 70% 35%, rgba(236, 72, 153, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 50% 75%, rgba(234, 179, 8, 0.75) 0%, transparent 45%),
      radial-gradient(circle at 85% 80%, rgba(225, 29, 72, 0.65) 0%, transparent 40%)
    `,
    cyber: `
      radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.8) 0%, transparent 45%),
      radial-gradient(circle at 75% 30%, rgba(99, 102, 241, 0.85) 0%, transparent 45%),
      radial-gradient(circle at 50% 70%, rgba(6, 182, 212, 0.75) 0%, transparent 45%),
      radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.7) 0%, transparent 40%)
    `,
    dark: `
      radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.45) 0%, transparent 45%),
      radial-gradient(circle at 70% 40%, rgba(147, 51, 234, 0.4) 0%, transparent 45%),
      radial-gradient(circle at 50% 70%, rgba(30, 41, 59, 0.8) 0%, transparent 55%)
    `,
  };

  const copyCode = async () => {
    const code = `<LiquidGlassThemeSwitcher
  value="${selectedTheme}"
  onChange={(t) => console.log(t)}
/>`;
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* Dynamic Colorful Mesh Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-1/2 w-[200%] h-[200%] blur-[70px] opacity-80 transition-all duration-700 animate-pulse"
          style={{ background: bgStyles[bgStyle] }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-10">
        
        {/* Title & Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Apple iOS 26 Liquid Glass</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Segmented Theme Switcher
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            High-fidelity physical edge refraction with SVG displacement filter, fluid liquid spring physics, and Apple glass styling.
          </p>
        </div>

        {/* Liquid Glass Switcher Interactive Preview Box */}
        <div className="relative w-full max-w-md p-10 rounded-3xl bg-white/[0.08] border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center gap-8">
          
          {/* Chromatic stripe & grid behind to highlight refraction */}
          <div className="relative flex items-center justify-center py-6 w-full">
            <div className="absolute w-64 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-indigo-500 rounded-full opacity-80 blur-[0.5px]" />
            <div className="absolute w-72 h-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />
            
            {/* The Liquid Glass Theme Switcher */}
            <LiquidGlassThemeSwitcher
              value={selectedTheme}
              onChange={handleSelectTheme}
            />
          </div>

          {/* Background Presets Bar */}
          <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full border border-white/10 text-xs text-slate-300">
            <span className="font-medium text-slate-400">Backdrop:</span>
            <button
              onClick={() => setBgStyle('aurora')}
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-sky-400 transition-transform ${
                bgStyle === 'aurora' ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              title="Aurora"
            />
            <button
              onClick={() => setBgStyle('sunset')}
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 transition-transform ${
                bgStyle === 'sunset' ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              title="Sunset"
            />
            <button
              onClick={() => setBgStyle('cyber')}
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 transition-transform ${
                bgStyle === 'cyber' ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              title="Cyber"
            />
            <button
              onClick={() => setBgStyle('dark')}
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 transition-transform ${
                bgStyle === 'dark' ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              title="Cosmic Dark"
            />
          </div>
        </div>

        {/* Features & Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-1">
              <Layers className="w-4 h-4" />
              <span>Lens Refraction</span>
            </div>
            <p className="text-xs text-slate-300">
              Backdrop-filter with SVG displacement map for physical lens distortion on glass boundaries with seamless CSS fallback.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase mb-1">
              <Sliders className="w-4 h-4" />
              <span>Fluid Elasticity</span>
            </div>
            <p className="text-xs text-slate-300">
              Dynamic directional squash & stretch (scaleX ~1.15) with spring easing (0.5, 1.6, 0.4, 1) and reduced-motion guard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>3 Adaptive Themes</span>
            </div>
            <p className="text-xs text-slate-300">
              Sun (light mode), Moon (dark mode), and Sun-with-horizon (dim mode) powered by contextual CSS variable tokens.
            </p>
          </div>
        </div>

        {/* Quick Usage Code Box */}
        <div className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 font-mono text-xs text-slate-300 flex items-center justify-between">
          <span className="truncate pr-4">
            import &#123; LiquidGlassThemeSwitcher &#125; from './components/LiquidGlassThemeSwitcher';
          </span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
