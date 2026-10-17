import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { ModelLineup } from './components/ModelLineup';
import { Features } from './components/Features';
import { Migration } from './components/Migration';
import { GettingStarted } from './components/GettingStarted';
import { CodeSwitcher } from './components/CodeSwitcher';
import { Footer } from './components/Footer';
import { PricingModal } from './components/PricingModal';
import { CheckoutModal } from './components/CheckoutModal';
import { KeyInspectorModal } from './components/KeyInspectorModal';
import { DocsModal } from './components/DocsModal';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';
import { StatusPage } from './pages/StatusPage';
import { CheckUsagePage } from './pages/CheckUsagePage';
import { ThemeSwitcherShowcase } from './pages/ThemeSwitcherShowcase';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ApiKey, PlanTier } from './types';
import { AnimatedTitle } from './components/AnimatedTitle';
import { useTheme } from './lib/theme';

export type ActiveView = 'home' | 'pricing' | 'docs' | 'status' | 'usage' | 'switcher';

/** Every view that renders a dedicated page instead of the home sections. */
const PAGES: readonly string[] = ['pricing', 'docs', 'status', 'usage', 'switcher'];

/** Hash aliases that all point at the key-usage inspector. */
const USAGE_ALIASES = ['usage', 'key-status', 'check-key', 'keystatus', 'keys'];

/** Home-page anchor slugs; these deep-link into the marketing page. */
const SECTIONS: readonly string[] = ['models', 'features', 'code-setup', 'get-started'];

/** Trims and URL-decodes a path segment, preserving case (key tokens are not lowercase). */
function readSlug(value: string): string {
  let clean = value.trim();
  try {
    const decoded = decodeURIComponent(clean);
    if (decoded && decoded.length === clean.length) clean = decoded;
  } catch {
    // Leave the raw segment as-is when it is malformed.
  }
  return clean;
}

/**
 * Resolves the current location into a view, an optional key slug, and an
 * optional home-section anchor. Handles clean paths (`/usage/sk-...`,
 * `/check-key?key=...`), hashes (`#/usage/sk-...`, `#/pricing`, `#/models`),
 * and `?key=` / `?token=` query params.
 */
function resolveRoute(location: Location): { view: ActiveView; key: string | null; section: string | null } {
  let key: string | null = null;

  const fromQuery = (search: string) => {
    if (!search) return;
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const value = params.get('key') || params.get('token') || params.get('key_token') || params.get('apiKey');
    if (value) key = key || value.trim();
  };

  fromQuery(location.search);

  const cleanPath = (location.pathname || '/').split('?')[0];
  const parts = cleanPath.split('/').filter(Boolean).map(readSlug);

  const fromHash = (hash: string): string[] => {
    const [base, ...rest] = hash.split('?');
    if (rest.length) fromQuery(`?${rest.join('?')}`);
    return base.split('/').filter(Boolean).map(readSlug);
  };

  const hashParts = fromHash(location.hash.replace(/^#/, ''));
  // A hash is normally the whole route (`#/usage/sk-...`), but a leftover
  // segment like `#pricing` pairs with the clean path `/usage/sk-...`.
  const pathParts = hashParts.length ? hashParts : parts;

  const first = (pathParts[0] || '').toLowerCase();
  if (!key && pathParts.length > 1) key = pathParts.slice(1).join('/');

  const section = SECTIONS.includes(first) ? first : null;
  const isUsage = USAGE_ALIASES.includes(first)
    || (pathParts.length >= 2 && (USAGE_ALIASES.includes((pathParts[1] || '').toLowerCase()) || pathParts[0] === 'key-status' || pathParts[0] === 'key'));

  if (isUsage) return { view: 'usage', key, section: null };
  if (PAGES.includes(first)) return { view: first as ActiveView, key, section: null };
  if (pathParts.length === 0) return { view: key ? 'usage' : 'home', key, section: null };
  if (section) return { view: 'home', key: null, section };

  // Unrecognised deep path: never hand a random slug off as a key token.
  return { view: 'home', key: null, section: null };
}

/** Turns a view + optional key into the clean path used to update the bar. */
function buildPath(view: ActiveView, key: string | null): string {
  if (view === 'home') return '/';
  return key ? `/${view}/${encodeURIComponent(key)}` : `/${view}`;
}

/**
 * Maps a hash-only legacy URL (`/#pricing`) onto its clean path. Only applied
 * when the path is still `/`; anything else is already in canonical form.
 */
function hashOnlyPath(hash: string): string {
  const part = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
  if (!part) return '/';
  if (SECTIONS.includes(part)) return `/#${part}`;
  if (PAGES.includes(part)) return `/${part}`;
  if (USAGE_ALIASES.includes(part)) return '/usage';
  return '/';
}

export function App() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [activeView, setActiveView] = useState<ActiveView>(() => resolveRoute(window.location).view);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier>('20x');
  const [keyInspectorOpen, setKeyInspectorOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [inspectedKey, setInspectedKey] = useState<string>(() => resolveRoute(window.location).key || '');
  // Pending home-section anchor, applied once the home sections have mounted.
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  // Reads the address bar into state. Idempotent — the setters only render
  // again when the resolved route actually differs, so back/forward, an
  // external link, or a hash-only legacy URL all converge on the same view.
  useEffect(() => {
    let initialised = false;

    const syncFromLocation = () => {
      const { view, key, section } = resolveRoute(window.location);
      if (key) setInspectedKey(key);
      setActiveView(view);
      setPendingSection(section);

      if (initialised) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Rewrite legacy hash-only URLs (`/#pricing`) to their clean path once,
        // so a refreshed page keeps its shareable slug. Also redirect removed pages like
        // /dashboard and /playground to the home root.
        const legacy = hashOnlyPath(window.location.hash);
        if (window.location.pathname !== legacy && window.location.hash) {
          window.history.replaceState(null, '', legacy);
        } else if (view === 'home' && window.location.pathname !== '/' && !window.location.hash) {
          window.history.replaceState(null, '', '/');
        }
        initialised = true;
      }
    };

    syncFromLocation();
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  // Scroll to the deep-linked section after the home page has rendered.
  useEffect(() => {
    if (!pendingSection || activeView !== 'home') return;
    const id = pendingSection;
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingSection(null);
    }, 90);
    return () => clearTimeout(timer);
  }, [pendingSection, activeView]);

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    setPendingSection(null);
    window.history.pushState(null, '', buildPath(view, view === 'usage' ? inspectedKey : null));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveView('home');
    window.history.pushState(null, '', '/');
    setPendingSection(sectionId);
  };

  const handleKeyAcquired = (key: ApiKey) => {
    setInspectedKey(key.key_token);
  };

  const handleSelectPlan = (tier: PlanTier) => {
    setSelectedTier(tier);
    setCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-300">
      {/* Navbar with Pricing, Docs, Status & Check Usage (last button next to Theme Toggle) */}
      <Navbar
        onOpenPricing={() => handleNavigate('pricing')}
        onOpenDocs={() => handleNavigate('docs')}
        onOpenStatus={() => handleNavigate('status')}
        onOpenCheckKey={() => handleNavigate('usage')}
        activeView={activeView}
        setActiveView={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* Home Page View */}
        {activeView === 'home' && (
          <>
            {/* Hero Section */}
            <Hero
              onOpenRegister={() => handleNavigate('pricing')}
            />

            {/* Marquee Bar */}
            <Marquee />

            {/* Section 01: The Lineup */}
            <ModelLineup />

            {/* Section 02: What you get */}
            <Features />

            {/* Section 03: Migration */}
            <Migration />

            {/* Section 04: Getting started */}
            <GettingStarted
              onOpenPricing={() => handleNavigate('pricing')}
              onOpenDocs={() => handleNavigate('docs')}
            />

            {/* Interactive Code Switcher Section */}
            <section className="py-16 md:py-24 border-t border-white/[0.08]" id="code-setup">
              <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
                    Integration Guide
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Works in your favorite tools today
                  </h2>
                  <p className="mt-3 text-sm text-slate-400">
                    Switch base URL to Opuszyra and begin developing with 1M context in seconds.
                  </p>
                </div>
                <div className="max-w-4xl mx-auto">
                  <CodeSwitcher />
                </div>
              </div>
            </section>

            {/* Final Call to Action */}
            <section className="py-20 md:py-28 border-t border-white/[0.08] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent pointer-events-none"></div>
              <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 lg:px-10 text-center relative">
                <AnimatedTitle
                  as="h2"
                  className="text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl"
                  lines={[
                    ['Stop', 'waiting', 'for'],
                    ['API', 'access.'],
                  ]}
                  highlightWords={['API', 'access']}
                />
                <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-slate-400">
                  Deploy high-throughput Claude applications on Opuszyra. Select a plan, activate via UPI, and
                  have an API key configured in your terminal in minutes.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => handleNavigate('pricing')}
                    className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <span>Get instant access</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleNavigate('usage')}
                    className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-dark-900/80 px-6 text-[15px] font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-dark-850 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span>Check your usage</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Dedicated Pricing Page */}
        {activeView === 'pricing' && (
          <PricingPage
            onSelectPlan={handleSelectPlan}
            onOpenCheckKey={() => handleNavigate('usage')}
          />
        )}

        {/* Dedicated Docs Page */}
        {activeView === 'docs' && (
          <DocsPage
            onOpenPricing={() => handleNavigate('pricing')}
            onOpenCheckUsage={() => handleNavigate('usage')}
            onOpenStatus={() => handleNavigate('status')}
          />
        )}

        {/* Dedicated Status Page */}
        {activeView === 'status' && (
          <StatusPage
            onOpenCheckUsage={() => handleNavigate('usage')}
          />
        )}

        {/* Dedicated Check Usage Page */}
        {activeView === 'usage' && (
          <CheckUsagePage
            onOpenPricing={() => handleNavigate('pricing')}
            initialKey={inspectedKey}
          />
        )}

        {/* Liquid Glass Theme Switcher Showcase View */}
        {activeView === 'switcher' && (
          <ThemeSwitcherShowcase
            currentTheme={theme as any}
            onThemeChange={(newTheme) => setTheme(newTheme)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenPricing={() => handleNavigate('pricing')}
        onOpenDocs={() => handleNavigate('docs')}
        onOpenStatus={() => handleNavigate('status')}
        onOpenCheckKey={() => handleNavigate('usage')}
        onNavigateSection={handleNavigateSection}
      />

      {/* Interactive Modals */}
      <CheckoutModal
        tier={selectedTier}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onKeyCreated={handleKeyAcquired}
      />

      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onKeyAcquired={handleKeyAcquired}
      />

      <KeyInspectorModal
        isOpen={keyInspectorOpen}
        onClose={() => setKeyInspectorOpen(false)}
        initialKey={inspectedKey}
      />

      <DocsModal isOpen={docsModalOpen} onClose={() => setDocsModalOpen(false)} />
    </div>
  );
}

export default App;
