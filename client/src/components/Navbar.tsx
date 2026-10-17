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
  setActiveView: (view: 'home' | 'pricing' | 'docs' | 'status' | 'usage' | 'dashboard' | 'playground' | 'switcher') => void;
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

  const handleNavPlayground = () => {
    setActiveView('playground');
    setMobileMenuOpen(false);
  };

  const handleNavDashboard = () => {
    setActiveView('dashboard');
    setMobileMenuOpen(false);
  };

  const handleNavCheckUsage = () => {
    setActiveView('usage');
    if (onOpenCheckKey) onOpenCheckKey();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/[0.08] bg-dark-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-8 lg:px-10">
        
        {/* Brand Logo */}
        <button
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-2.5 sm:gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
          aria-label="Opuszyra home"
        >
          <img
            src="/logo.png"
            alt="Opuszyra Logo"
            width="44"
            height="44"
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_10px_rgba(234,88,12,0.35)]"
          />
          <span className="text-[17px] sm:text-[18px] font-bold tracking-tight text-white font-mono">
            Opus<span className="text-brand-500">zyra</span>
          </span>
        </button>

        {/* Center Desktop Navigation: Pricing, Docs, Playground, Status */}
        <nav className="hidden items-center gap-1 md:flex">
          <button
            onClick={handleNavPricing}
            className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeView === 'pricing'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={handleNavDocs}
            className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeView === 'docs'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Docs
          </button>

          <button
            onClick={handleNavPlayground}
            className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeView === 'playground'
                ? 'text-white bg-white/[0.1] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Playground
          </button>

          <button
            onClick={handleNavStatus}
            className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-colors rounded-lg inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
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

        {/* Right Action: Check Usage placed near Dark Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Check Usage Button: visible on tablet/desktop */}
          <button
            onClick={handleNavCheckUsage}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
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
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="border-b border-white/[0.08] bg-dark-950/95 backdrop-blur-2xl px-5 py-4 space-y-2 md:hidden animate-fadeIn">
          <button
            onClick={handleNavPricing}
            className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'pricing'
                ? 'text-white bg-white/10 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Pricing &amp; Plans
          </button>

          <button
            onClick={handleNavDocs}
            className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'docs'
                ? 'text-white bg-white/10 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Documentation
          </button>

          <button
            onClick={handleNavPlayground}
            className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'playground'
                ? 'text-white bg-white/10 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Live Playground
          </button>

          <button
            onClick={handleNavDashboard}
            className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'dashboard'
                ? 'text-white bg-white/10 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={handleNavStatus}
            className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
              activeView === 'status'
                ? 'text-white bg-white/10 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Gateway Status</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              99.99% Operational
            </span>
          </button>

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={handleNavCheckUsage}
              className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-mono flex items-center gap-2 transition-all ${
                activeView === 'usage'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Check Key Usage</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
