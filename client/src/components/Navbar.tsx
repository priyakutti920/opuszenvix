import React, { useState } from 'react';
import { Menu, X, Key, Zap } from 'lucide-react';
import { Theme } from '../lib/theme';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenPricing?: () => void;
  onOpenDocs?: () => void;
  onOpenStatus?: () => void;
  onOpenCheckKey?: () => void;
  activeView: string;
  setActiveView: (view: 'home' | 'pricing' | 'docs' | 'status' | 'usage' | 'dashboard' | 'playground') => void;
  theme: Theme;
  onToggleTheme: (e: React.MouseEvent) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPricing,
  onOpenDocs,
  onOpenStatus,
  onOpenCheckKey,
  activeView,
  setActiveView,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavPricing = () => {
    setActiveView('pricing');
    if (onOpenPricing) onOpenPricing();
    setMobileMenuOpen(false);
  };

  const handleNavDocs = () => {
    setActiveView('docs');
    if (onOpenDocs) onOpenDocs();
    setMobileMenuOpen(false);
  };

  const handleNavStatus = () => {
    setActiveView('status');
    if (onOpenStatus) onOpenStatus();
    setMobileMenuOpen(false);
  };

  const handleNavCheckUsage = () => {
    setActiveView('usage');
    if (onOpenCheckKey) onOpenCheckKey();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/[0.08] bg-dark-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        
        {/* Brand Logo */}
        <button
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-2.5 text-left group"
          aria-label="Opuszyra home"
        >
          <span
            className="h-7 w-7 text-[12px] inline-flex items-center justify-center rounded-[6px] bg-brand-500 font-black text-white shadow-sm transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            O
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-white font-mono">
            Opus<span className="text-brand-500">zyra</span>
          </span>
        </button>

        {/* Center Desktop Navigation: Pricing, Docs, Status */}
        <nav className="hidden items-center gap-1 md:flex">
          <button
            onClick={handleNavPricing}
            className={`relative px-3.5 py-2 text-[13px] font-medium transition-colors rounded-lg ${
              activeView === 'pricing'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={handleNavDocs}
            className={`relative px-3.5 py-2 text-[13px] font-medium transition-colors rounded-lg ${
              activeView === 'docs'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Docs
          </button>

          <button
            onClick={handleNavStatus}
            className={`relative px-3.5 py-2 text-[13px] font-medium transition-colors rounded-lg inline-flex items-center gap-1.5 ${
              activeView === 'status'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Status</span>
          </button>
        </nav>

        {/* Right Action: Check Usage (last button) placed right near Dark Mode Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Check Usage Button: The last button right near dark mode toggle */}
          <button
            onClick={handleNavCheckUsage}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeView === 'usage'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
            }`}
            title="Check API Key Usage & Quota"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Check Usage</span>
          </button>

          {/* White / Dark Theme Toggle Button */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-dark-950/95 px-5 py-4 space-y-3 md:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs text-slate-400">Theme</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>

          <button
            onClick={handleNavPricing}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activeView === 'pricing' ? 'text-brand-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={handleNavDocs}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activeView === 'docs' ? 'text-brand-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Docs
          </button>

          <button
            onClick={handleNavStatus}
            className={`w-full text-left py-2 text-sm font-medium flex items-center justify-between ${
              activeView === 'status' ? 'text-brand-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Status</span>
            <span className="text-xs text-emerald-400 font-mono">● Operational (99.98%)</span>
          </button>

          <button
            onClick={handleNavCheckUsage}
            className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-mono flex items-center gap-2 ${
              activeView === 'usage'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Check Usage</span>
          </button>
        </div>
      )}
    </header>
  );
};
