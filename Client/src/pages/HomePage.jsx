/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import Terms from '../components/Terms';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../utils/roleBasedRouting';
import useAuthStore from '../stores/Zustand.store';
import { showSuccessToast, showValidationError } from '../utils/toastConfig';
import pricingData from '../data/homePricing.json';
import { useCompleteGoogleProfile } from '../hooks/userHooks/useCompleteGoogleProfile';

/**
 * HomePage — Kerala marketing landing with banner hero and inline newsletter cards.
 * Footer remains global in App (ConditionalFooter). Logged-in users redirect to role dashboard.
 */
const MOBILE_PATTERN = /^\d{10}$/;

const PRICING_BY_PERIOD = pricingData;

const HomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [heroPrompt, setHeroPrompt] = useState('');
  const [quickOrderSheetOpen, setQuickOrderSheetOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('veg');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [leadForm, setLeadForm] = useState({
    mobile: '',
    termsAccepted: false,
  });
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const gradient = theme.homeGradient || 'from-orange-50 via-white to-orange-50';

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const activeRole = useAuthStore((state) => state.activeRole);
  const showRoleSelector = useAuthStore((state) => state.showRoleSelector);
  const { mutate: completeGoogleProfile, isPending: isCompletingGoogleProfile } = useCompleteGoogleProfile();

  const openSignInSlider = useCallback(() => {
    setAuthInitialTab('login');
    setAuthSliderOpen(true);
  }, []);
  const openRegisterSlider = useCallback(() => {
    setAuthInitialTab('register');
    setAuthSliderOpen(true);
  }, []);
  const closeAuthSlider = useCallback(() => setAuthSliderOpen(false), []);
  const pricingRef = useRef(null);
  const supportRef = useRef(null);

  const scrollToSection = useCallback((sectionRef) => {
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleHeroPromptSubmit = useCallback((event) => {
    event.preventDefault();
    const normalizedPrompt = String(heroPrompt || '').trim().toLowerCase();
    if (normalizedPrompt.includes('sign in') || normalizedPrompt.includes('login')) {
      openSignInSlider();
      return;
    }
    setQuickOrderSheetOpen(true);
  }, [heroPrompt, openSignInSlider]);

  const isGoogleUser = Boolean(user?.isGoogleAuth);
  const hasUserPhone = useMemo(() => {
    const digits = String(user?.phone || '').replace(/\D/g, '');
    return digits.length >= 10;
  }, [user?.phone]);
  const needsGoogleProfileCompletion = Boolean(user && isGoogleUser && (!hasUserPhone || user?.termsAccepted !== true));

  const handlePricingCardAction = useCallback(() => {
    if (!user) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        openSignInSlider();
        return;
      }
      openRegisterSlider();
      return;
    }

    if (needsGoogleProfileCompletion) {
      const phoneDigits = String(user?.phone || '').replace(/\D/g, '');
      setLeadForm({
        mobile: phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '',
        termsAccepted: Boolean(user?.termsAccepted),
      });
      setQuickOrderSheetOpen(true);
      return;
    }

    navigate(`${base}/place-order`);
  }, [user, needsGoogleProfileCompletion, openSignInSlider, openRegisterSlider, navigate, base, user?.phone, user?.termsAccepted]);

  const visiblePricingCards = useMemo(
    () => (PRICING_BY_PERIOD[selectedPeriod] || []),
    [selectedPeriod]
  );

  useEffect(() => {
    if (!user || !roles || roles.length === 0) return;
    if (showRoleSelector) return;
    const selected = resolveSelectedRoleForDashboard(roles, activeRole, base);
    const dashboardRoute = getDashboardRoute(roles, base, selected);
    if (dashboardRoute && dashboardRoute !== base) {
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, roles, base, navigate, activeRole, showRoleSelector]);

  const submitLeadForm = useCallback((event) => {
    event.preventDefault();
    const mobile = String(leadForm.mobile || '').replace(/\D/g, '');
    if (!MOBILE_PATTERN.test(mobile)) {
      showValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!leadForm.termsAccepted) {
      showValidationError('Please accept the Terms & Conditions to continue.');
      return;
    }

    completeGoogleProfile(
      { phone: mobile, termsAccepted: true },
      {
        onSuccess: (response) => {
          if (!response?.success) return;
          showSuccessToast('Your profile is updated. Continue booking your plan.', 'Done');
          setLeadForm({ mobile: '', termsAccepted: false });
          setQuickOrderSheetOpen(false);
          navigate(`${base}/place-order`);
        },
        onError: (error) => {
          const message = error?.response?.data?.message || 'Unable to update your profile. Please try again.';
          showValidationError(message);
        }
      }
    );
  }, [leadForm, completeGoogleProfile, navigate, base]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${gradient}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Navbar minimalNav onSignInClick={openSignInSlider} onRegisterClick={openRegisterSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} initialTab={authInitialTab} />

      <main>
        <section
          className="relative isolate overflow-hidden px-0 pb-0 pt-0"
          style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
        >
          <div
            className="relative flex min-h-[320px] w-full items-center overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.20)] sm:min-h-[400px]"
            style={{
              background: `linear-gradient(135deg, ${accent}20 0%, #111827 35%, #1f2937 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/15 to-transparent" />
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-12 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${accent}50` }} />

            <div className="relative z-10 w-full px-5 py-16 sm:px-10 sm:py-20 lg:px-14">
              <div className="mx-auto mt-6 max-w-3xl text-center sm:mt-8">
                <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  {theme.heroTitle || 'Everything fresh from Kerala.'}
                  <span
                    className={`mt-2 block ${theme.brandDisplayFontClass || ''}`}
                    style={{ color: theme.brandDisplayColor || accent }}
                  >
                    {theme.heroSubtitle || 'No compromise on taste.'}
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base md:text-lg">
                  {theme.heroDescription ||
                    "Order home-cooked Kerala favorites for every mood in one place. Freshly prepared meals, quick delivery, and weekly curated menus that keep your routine delicious."}
                </p>

                <form
                  onSubmit={handleHeroPromptSubmit}
                  className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-white/35 bg-black/25 p-2 backdrop-blur-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={heroPrompt}
                      onChange={(event) => setHeroPrompt(event.target.value)}
                      placeholder="Ask anything... e.g. 'I want a weekly non-veg plan'"
                      className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/65 outline-none transition focus:border-white/55 focus:bg-white/15"
                    />
                    <button
                      type="submit"
                      className="h-12 shrink-0 rounded-xl px-5 text-sm font-bold text-black transition hover:brightness-105"
                      style={{ backgroundColor: accent }}
                    >
                      Continue
                    </button>
                  </div>
                </form>
                <p className="mt-3 text-xs text-white/75">
                  Try: &quot;Show monthly plans&quot;, &quot;Order today&quot;, or &quot;Sign in&quot;.
                </p>

              </div>
            </div>
          </div>

        </section>

        <section className="relative overflow-hidden px-4 pb-12 pt-0 sm:px-6 sm:pb-14 sm:pt-0 lg:pb-16 lg:pt-0">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(180deg, #1f2937 0%, #111827 40%, ${accent}1F 100%)` }}
          />
          <div className="relative mx-auto max-w-6xl">
            <div ref={pricingRef} className="mt-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Plans and pricing</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                JAY&apos;S KERALA KITCHEN
              </h3>
            </div>

            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur">
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => setSelectedDiet('veg')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                    selectedDiet === 'veg' ? 'text-white' : 'bg-white/20 text-white/85'
                  }`}
                  style={selectedDiet === 'veg' ? { backgroundColor: accent } : undefined}
                >
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiet('nonVeg')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                    selectedDiet === 'nonVeg' ? 'text-white' : 'bg-white/20 text-white/85'
                  }`}
                  style={selectedDiet === 'nonVeg' ? { backgroundColor: accent } : undefined}
                >
                  Non-Veg
                </button>
              </div>
              <div className="mt-2 grid w-full grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold capitalize transition sm:w-auto ${
                      selectedPeriod === period ? 'text-white' : 'bg-white/20 text-white/85'
                    }`}
                    style={selectedPeriod === period ? { backgroundColor: accent } : undefined}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {visiblePricingCards.map((card) => (
                <button
                  type="button"
                  key={card.title}
                  onClick={handlePricingCardAction}
                  className="group rounded-2xl border border-gray-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] active:scale-[0.99] active:shadow-[0_0_0_2px_rgba(251,146,60,0.25)]"
                >
                  <h3 className="text-base font-black text-gray-900 md:text-lg">{card.title}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 md:hidden">
                    {selectedDiet === 'veg' ? 'Veg plan' : 'Non-veg plan'}
                  </p>
                  <p className="mt-2 text-2xl font-black text-gray-900 md:mt-3">
                    {selectedDiet === 'veg' ? card.veg : card.nonVeg}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 md:hidden">
                    {selectedDiet === 'veg' ? card.vegHint : card.nonVegHint}
                  </p>
                  <div className="mt-5 hidden border-t border-gray-200 pt-3 md:flex md:items-center md:justify-center">
                    <span className="text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-700">
                      Book Now →
                    </span>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </section>
      </main>

      {quickOrderSheetOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50" onClick={() => setQuickOrderSheetOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Complete profile</p>
            <h4 className="mt-2 text-xl font-black text-gray-900">Add your mobile number</h4>
            <form onSubmit={submitLeadForm} className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={leadForm.mobile}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, mobile: event.target.value }))}
                  placeholder="Enter Mobile Number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  required
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={leadForm.termsAccepted}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))}
                  className="mt-1"
                  required
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-semibold text-orange-600 underline"
                    onClick={() => setTermsModalOpen(true)}
                  >
                    Terms & Conditions
                  </button>
                  .
                </span>
              </label>
              <button
                type="submit"
                disabled={isCompletingGoogleProfile}
                className="w-full rounded-xl px-4 py-3 text-sm font-bold text-black transition hover:brightness-105"
                style={{ backgroundColor: accent }}
              >
                {isCompletingGoogleProfile ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <Terms isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />

    </div>
  );
};

export default HomePage;
