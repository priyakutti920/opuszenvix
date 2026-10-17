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
import { PlaygroundModal } from './components/PlaygroundModal';
import { Dashboard } from './components/Dashboard';
import { Playground } from './components/Playground';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';
import { StatusPage } from './pages/StatusPage';
import { CheckUsagePage } from './pages/CheckUsagePage';
import { ThemeSwitcherShowcase } from './pages/ThemeSwitcherShowcase';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ApiKey, PlanTier } from './types';
import { AnimatedTitle } from './components/AnimatedTitle';
import { useTheme } from './lib/theme';

export type ActiveView = 'home' | 'pricing' | 'docs' | 'status' | 'usage' | 'dashboard' | 'playground' | 'switcher';

export function App() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier>('20x');
  const [keyInspectorOpen, setKeyInspectorOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false);
  const [inspectedKey, setInspectedKey] = useState<string>('');

  // Handle URL hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['pricing', 'docs', 'status', 'usage', 'dashboard', 'playground', 'switcher', 'home'].includes(hash)) {
        setActiveView(hash as ActiveView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (['models', 'features', 'code-setup', 'get-started'].includes(hash)) {
        setActiveView('home');
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 80);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    if (view === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveView('home');
    window.location.hash = sectionId;
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
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
              onOpenPricing={() => handleNavigate('pricing')}
              onOpenPlayground={() => handleNavigate('playground')}
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
                  Over two thousand developers already build on Opuszyra. Sign up, pay with UPI, and
                  have a key in your terminal before your coffee lands.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => handleNavigate('pricing')}
                    className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Get instant access</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleNavigate('usage')}
                    className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-dark-900/60 px-6 text-[15px] font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-dark-850 hover:text-white"
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

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="py-8">
            <Dashboard
              onCheckKey={(key: string) => {
                setInspectedKey(key);
                handleNavigate('usage');
              }}
              onOpenPlayground={() => handleNavigate('playground')}
            />
          </div>
        )}

        {/* Playground View */}
        {activeView === 'playground' && (
          <div className="py-8">
            <Playground />
          </div>
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

      <PlaygroundModal
        isOpen={playgroundModalOpen}
        onClose={() => setPlaygroundModalOpen(false)}
        defaultKey={inspectedKey || undefined}
      />
    </div>
  );
}

export default App;
