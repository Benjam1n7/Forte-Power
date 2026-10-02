import React, { useState, useEffect } from 'react';
import { Product } from './types';
import { fetchProductsFromDatabase } from './lib/supabaseProducts';
import { RecommendationResult } from './lib/recommendation';
import { Persona, PersonaCards } from './components/home/PersonaCards';
import { DramaticHero } from './components/home/DramaticHero';
import { KitBuilderStepFlow } from './components/kit-builder/KitBuilderStepFlow';
import { CostVsGeneratorSection } from './components/home/CostVsGeneratorSection';
import { Navbar } from './components/layout/Navbar';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { SignInGate } from './components/checkout/SignInGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SignalDot } from './components/ui/SignalDot';
import { RefreshCw, AlertTriangle } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'shop' | 'builder' | 'calculator' | 'checkout'>('shop');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Persona synchronization state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('remote_worker');
  const [activeHours, setActiveHours] = useState<number>(8);
  const [presetWatts, setPresetWatts] = useState<Record<string, number>>({
    laptop: 50,
    phone: 15,
    router: 12,
    fan: 20,
    lamp: 10,
  });

  // Recommended kit feedback for cost-vs-generator
  const [recommendedKit, setRecommendedKit] = useState<RecommendationResult | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchProductsFromDatabase();
    setCatalog(res.data);
    if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersonaId(persona.id);
    setActiveHours(persona.presetHours);
    setPresetWatts(persona.presetWatts);

    // Smooth scroll down to builder
    const builderEl = document.getElementById('kit-builder-section');
    if (builderEl) {
      builderEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigate = (view: 'shop' | 'builder' | 'calculator' | 'checkout') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B1B1A] flex flex-col antialiased selection:bg-[#FF5B35] selection:text-white">
      {/* Top Bar Header with "Continue with Google" or User Avatar */}
      <Navbar onNavigate={handleNavigate} activeView={currentView} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-10 md:py-16">
        
        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#1B1B1A] border-t-[#FF5B35] rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
              Connecting to Supabase product catalog...
            </p>
          </div>
        )}

        {/* Database Error/Notice Banner */}
        {!loading && error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Database Notification</span>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={loadCatalog}
              className="px-3 py-1 bg-amber-900 text-white font-mono text-[11px] rounded-lg hover:bg-amber-800 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* View 1: Shop & Overview */}
        {!loading && currentView === 'shop' && (
          <>
            {/* Dramatic Pendant Lamp Inspired Hero */}
            <DramaticHero
              featuredProducts={catalog}
              onExploreBuilder={() => {
                const builderEl = document.getElementById('kit-builder-section');
                if (builderEl) {
                  builderEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            {/* Four Persona Cards */}
            <div className="mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] block mb-2 font-bold">
                1. Select Your Outage Reality
              </span>
            </div>
            <PersonaCards
              onSelectPersona={handleSelectPersona}
              selectedPersonaId={selectedPersonaId}
            />

            {/* 3-Step Kit Builder */}
            <div id="kit-builder-section">
              <KitBuilderStepFlow
                catalog={catalog}
                initialHours={activeHours}
                initialPresetWatts={presetWatts}
                onKitCalculated={result => setRecommendedKit(result)}
                onProceedToCheckout={() => setCurrentView('checkout')}
              />
            </div>

            {/* Cost vs Generator Block */}
            <CostVsGeneratorSection
              recommendedKitPrice={recommendedKit?.bundlePriceNaira || 118275}
              outageHours={recommendedKit?.outageHours || activeHours}
            />
          </>
        )}

        {/* View 2: Dedicated 3-Step Builder */}
        {!loading && currentView === 'builder' && (
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h2 className="font-display font-extrabold text-3xl text-[#1B1B1A]">
                3-Step Resilience Kit Builder
              </h2>
              <p className="text-xs sm:text-sm text-[#6E6D68] mt-1">
                Configure your appliances and daily blackout duration to calculate your exact Watt-hour requirement.
              </p>
            </div>

            <KitBuilderStepFlow
              catalog={catalog}
              initialHours={activeHours}
              initialPresetWatts={presetWatts}
              onKitCalculated={result => setRecommendedKit(result)}
              onProceedToCheckout={() => setCurrentView('checkout')}
            />
          </div>
        )}

        {/* View 3: Cost vs Generator Calculator */}
        {!loading && currentView === 'calculator' && (
          <div className="space-y-8">
            <CostVsGeneratorSection
              recommendedKitPrice={recommendedKit?.bundlePriceNaira || 118275}
              outageHours={recommendedKit?.outageHours || activeHours}
            />
          </div>
        )}

        {/* View 4: Protected Checkout Route */}
        {!loading && currentView === 'checkout' && (
          <>
            {user ? (
              <CheckoutPage onBackToShop={() => setCurrentView('shop')} />
            ) : (
              <SignInGate onBackToShop={() => setCurrentView('shop')} />
            )}
          </>
        )}

      </main>

      {/* Cart Drawer */}
      <CartDrawer onNavigateToCheckout={() => setCurrentView('checkout')} catalog={catalog} />

      {/* Footer */}
      <footer className="border-t border-[#1B1B1A]/15 bg-[#F5F1E8] py-8 px-4 md:px-8 text-center text-xs text-[#6E6D68] font-mono">
        <p>Forte Power Systems Nigeria · Zero petrol exhaust · 100% silent power</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
