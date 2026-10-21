import React, { useState, useEffect } from 'react';
import { Menu, X, Key } from 'lucide-react';
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
  theme?: Theme;
  onToggleTheme?: (e: React.MouseEvent) => void;
}

interface NavItem {
  view: ActiveView;
  label: string;
  mobileLabel?: string;
  /** Renders the emerald availability dot before the label. */
  statusDot?: boolean;
}

/** Desktop navigation items. */
const DESKTOP_ITEMS: NavItem[] = [
  { view: 'pricing', label: 'Pricing' },
  { view: 'docs', label: 'Docs' },
  { view: 'status', label: 'Status', statusDot: true },
];

/** Mobile navigation items. */
const MOBILE_ITEMS: NavItem[] = [
  { view: 'pricing', label: 'Pricing & Plans' },
  { view: 'docs', label: 'Documentation' },
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
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="flex h-14 items-center justify-between rounded-full border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-dark-950/85 pl-4 pr-2 backdrop-blur-md transition-colors duration-200 sm:pl-5 sm:pr-2.5 shadow-sm dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.25)]">
          {/* Brand Logo */}
          <button
            onClick={() => go('home')}
            className="shrink-0 inline-flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full"
            aria-label="OpusZenvix home"
          >
            <img
              src="/logo.png"
              alt="OpusZenvix"
              width="32"
              height="32"
              className="h-8 w-8 rounded-lg object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(234,88,12,0.35)]"
            />
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white text-[15px]">
              Opus<span className="text-brand-500">Zenvix</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {DESKTOP_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={itemFor(item.view)}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-white/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {item.view === 'status' && (
                    <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle"></span>
                  )}
                  {item.label}
                </button>
              );
            })}

            <span aria-hidden="true" className="mx-2 h-5 w-px bg-slate-200 dark:bg-white/10" />

            {/* Check a key pill button */}
            <button
              onClick={handleNavCheckUsage}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-all focus-visible:outline-none ${
                activeView === 'usage'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-dark-950 dark:hover:bg-slate-200 shadow-sm'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span>Check a key</span>
            </button>

            {/* Theme Toggle Button */}
            <div className="ml-1">
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </div>

          {/* Mobile hamburger button & ThemeToggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mx-4 mt-2 max-w-6xl sm:mx-auto">
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-dark-950/95 p-4 shadow-2xl backdrop-blur-2xl space-y-1.5 md:hidden"
          >
            {MOBILE_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={itemFor(item.view)}
                  className={`block w-full text-left py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-white/10 font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.view === 'status' ? (
                    <span className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
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

            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={handleNavCheckUsage}
                className="w-full justify-center inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-dark-950 px-4 text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
              >
                <Key className="h-4 w-4" />
                <span>Check a key</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
