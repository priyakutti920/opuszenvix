import React, { useState, useEffect } from 'react';
import { Menu, X, Key, LayoutDashboard } from 'lucide-react';
import { Theme } from '../lib/theme';
import { ThemeToggle } from './ThemeToggle';
import { ActiveView } from '../App';

interface NavbarProps {
  onOpenPricing?: () => void;
  onOpenDocs?: () => void;
  onOpenStatus?: () => void;
  onOpenCheckKey?: () => void;
  activeView: string;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  onToggleTheme: (e: React.MouseEvent) => void;
}

interface NavItem {
  view: ActiveView;
  label: string;
  /** Renders the emerald availability dot before the label. */
  statusDot?: boolean;
}

/** Desktop keeps the original four items; the dashboard sits in the action
 *  cluster so the centre row still fits at the `md` breakpoint. */
const DESKTOP_ITEMS: NavItem[] = [
  { view: 'pricing', label: 'Pricing' },
  { view: 'docs', label: 'Docs' },
  { view: 'playground', label: 'Playground' },
  { view: 'status', label: 'Status', statusDot: true },
];

/** Mobile drops Playground — it is one tap from the Home hero and stays
 *  linked from the footer. */
const MOBILE_ITEMS: NavItem[] = [
  { view: 'pricing', label: 'Pricing & Plans' },
  { view: 'docs', label: 'Documentation' },
  { view: 'dashboard', label: 'Console Dashboard' },
  { view: 'status', label: 'System Status', statusDot: true },
];

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

  // Selecting an item always closes the drawer.
  const go = (view: ActiveView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const handleNavPricing = () => {
    go('pricing');
    if (onOpenPricing) onOpenPricing();
  };

  const handleNavDocs = () => {
    go('docs');
    if (onOpenDocs) onOpenDocs();
  };

  const handleNavStatus = () => {
    go('status');
    if (onOpenStatus) onOpenStatus();
  };

  const handleNavCheckUsage = () => {
    go('usage');
    if (onOpenCheckKey) onOpenCheckKey();
  };

  const itemFor = (view: ActiveView) =>
    view === 'pricing' ? handleNavPricing
    : view === 'docs' ? handleNavDocs
    : view === 'status' ? handleNavStatus
    : () => go(view);

  // Close the drawer on Escape and lock background scroll while it is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/[0.08] bg-dark-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-8 lg:px-10">

        {" "}
        {/* Brand Logo */}
        <button
          onClick={() => go('home')}
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
          {DESKTOP_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={itemFor(item.view)}
                className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  isActive
                    ? 'text-white bg-white/[0.1] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.view === 'status' && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                  </span>
                )}
                <span className={item.view === 'status' ? 'pl-2' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action: Check Usage placed near Dark Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {" "}
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

          {/* Console Dashboard (kept to an icon so the nav still fits at md) */}
          <button
            onClick={() => go('dashboard')}
            className={`hidden md:inline-flex items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeView === 'dashboard'
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Console Dashboard"
            aria-label="Console Dashboard"
            aria-current={activeView === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>

          {" "}
          {/* White / Dark Theme Toggle Button */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {" "}
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

      {" "}
      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-nav-drawer" aria-label="Mobile navigation" className="border-b border-white/[0.08] bg-dark-950/95 backdrop-blur-2xl px-5 py-4 space-y-2 md:hidden animate-fadeIn">
          {MOBILE_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={itemFor(item.view)}
                className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-white bg-white/10 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.view === 'status' ? (
                  <span className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Operational
                    </span>
                  </span>
                ) : (
                  item.mobileLabel || item.label
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={handleNavCheckUsage}
              className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-mono flex items-center gap-2 transition-all ${
                activeView === 'usage'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
              aria-current={activeView === 'usage' ? 'page' : undefined}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Check Key Usage</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
