/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiCheckCircle, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import Terms from '../components/Terms';
import MenuPage from './MenuPage';
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

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Sign Up',
    cue: 'Choose plan',
    icon: FiUserPlus,
  },
  {
    title: 'Confirm',
    cue: 'One-click booking',
    icon: FiCheckCircle,
  },
  {
    title: 'Enjoy Meals',
    cue: 'Daily doorstep delivery',
    icon: FiTruck,
  },
];

const PLAN_COMMON_HIGHLIGHTS = [
  'Lunch meal included',
  'Freshly cooked and delivered for your selected day',
  'Authentic home-style Kerala taste',
  'Free doorstep delivery across Kochi',
];

const HomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [heroPrompt, setHeroPrompt] = useState('');
  const [quickOrderSheetOpen, setQuickOrderSheetOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('veg');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [hasPromptedGoogleSetup, setHasPromptedGoogleSetup] = useState(false);
  const [leadForm, setLeadForm] = useState({
    mobile: '',
    termsAccepted: false,
  });
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const gradient = theme.homeGradient || 'from-orange-50 via-white to-orange-50';
  const supportEmail = import.meta.env.VITE_TERMS_CONTACT_EMAIL || 'support@jayskerala.com';

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
  const isPhonePasswordCustomer = useMemo(() => {
    if (!user) return false;
    const hasEmail = Boolean(String(user?.email || '').trim());
    return hasUserPhone && !isGoogleUser && !hasEmail;
  }, [user, hasUserPhone, isGoogleUser]);
  const needsGoogleProfileCompletion = Boolean(user && isGoogleUser && (!hasUserPhone || user?.termsAccepted !== true));

  useEffect(() => {
    if (!user || !needsGoogleProfileCompletion || hasPromptedGoogleSetup) return;

    const phoneDigits = String(user?.phone || '').replace(/\D/g, '');
    setLeadForm({
      mobile: phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '',
      termsAccepted: Boolean(user?.termsAccepted),
    });
    setQuickOrderSheetOpen(true);
    setHasPromptedGoogleSetup(true);
  }, [user, needsGoogleProfileCompletion, hasPromptedGoogleSetup, user?.phone, user?.termsAccepted]);

  useEffect(() => {
    if (!user) {
      setHasPromptedGoogleSetup(false);
    }
  }, [user]);

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

  if (isPhonePasswordCustomer) {
    return <MenuPage minimalNav />;
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-gradient-to-br ${gradient}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Navbar minimalNav onSignInClick={openSignInSlider} onRegisterClick={openRegisterSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} initialTab={authInitialTab} />

      <main>
        <section className="relative isolate overflow-hidden px-0 pb-0 pt-0">
          <div
            className="relative flex min-h-[320px] w-full items-center overflow-hidden sm:min-h-[400px]"
            style={{
              background: `linear-gradient(135deg, ${accent}10 0%, #111827 30%, #1f2937 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/15 to-transparent" />
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-12 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${accent}50` }} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#111827]/80 to-[#111827]" />

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
                      Go
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
            style={{ background: `linear-gradient(180deg, #111827 0%, #111827 42%, ${accent}1F 100%)` }}
          />
          <div className="relative mx-auto max-w-6xl">
            <div ref={pricingRef} className="mt-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Plans and pricing</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                JAY&apos;S KERALA KITCHEN
              </h3>
            </div>

            <div className="mx-auto mt-4 w-full max-w-2xl rounded-xl border border-white/20 bg-white/10 p-2 shadow-sm backdrop-blur md:w-fit md:max-w-full md:p-1.5">
              <div className="grid w-full grid-cols-2 gap-1.5 md:flex md:flex-wrap md:items-center md:justify-center md:gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDiet('veg')}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition md:px-3 ${
                    selectedDiet === 'veg' ? 'text-white' : 'bg-white/20 text-white/85'
                  }`}
                  style={selectedDiet === 'veg' ? { backgroundColor: accent } : undefined}
                >
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiet('nonVeg')}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition md:px-3 ${
                    selectedDiet === 'nonVeg' ? 'text-white' : 'bg-white/20 text-white/85'
                  }`}
                  style={selectedDiet === 'nonVeg' ? { backgroundColor: accent } : undefined}
                >
                  Non-Veg
                </button>
              </div>
              <div className="mt-1.5 grid w-full grid-cols-3 gap-1.5 md:mt-1 md:flex md:flex-wrap md:items-center md:gap-1">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition md:px-2.5 ${
                      selectedPeriod === period ? 'text-white' : 'bg-white/20 text-white/85'
                    }`}
                    style={selectedPeriod === period ? { backgroundColor: accent } : undefined}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">What&apos;s included</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {PLAN_COMMON_HIGHLIGHTS.map((point) => (
                  <li
                    key={point}
                    className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {visiblePricingCards.map((card) => (
                <button
                  type="button"
                  key={card.title}
                  onClick={handlePricingCardAction}
                  className="group rounded-3xl border border-white/70 bg-white/95 p-3.5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.16)] active:scale-[0.99]"
                >
                  <h3 className="text-sm font-black text-gray-900 md:text-base">{card.title}</h3>
                  <p className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">
                    {selectedDiet === 'veg' ? 'Veg plan' : 'Non-veg plan'}
                  </p>
                  <p className="mt-1.5 text-xl font-black text-gray-900 md:text-2xl">
                    {selectedDiet === 'veg' ? card.veg : card.nonVeg}
                  </p>
                  <div className="mt-3 flex">
                    <span
                      className="ml-auto inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all group-hover:translate-x-0.5"
                      style={{ color: accent, borderColor: `${accent}66`, backgroundColor: `${accent}1A` }}
                    >
                      Book Now →
                    </span>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </section>

        <section className="bg-gradient-to-b from-[#eadbc8]/70 via-[#dddad5]/60 to-transparent px-4 pb-4 pt-3 sm:px-6 lg:pb-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gray-100/90 p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">How It Works</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
              Start your meal plan in 3 simple steps
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-gray-200 bg-gray-100 p-3.5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
                    Step {index + 1}
                  </p>
                  <div className="mx-auto mt-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                    <step.icon className="h-5 w-5 text-gray-800" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 text-base font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500">{step.cue}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 px-4 pb-14 sm:mt-10 sm:px-6 lg:pb-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl bg-gray-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Quick links and support</p>
              <h3 className="mt-2 text-2xl font-black">Need help before ordering?</h3>
              <p className="mt-2 text-sm text-white/80">
                Manage your food bookings, check subscription support, and contact us for delivery updates.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`${base}/terms`)}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              >
                Terms & Conditions
              </button>
              <a
                href={`mailto:${supportEmail}`}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              >
                Contact Support
              </a>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Setup account</p>
            <h4 className="mt-2 text-xl font-black text-gray-900">Get started with your mobile number</h4>
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
              <button
                type="button"
                onClick={() => setQuickOrderSheetOpen(false)}
                disabled={isCompletingGoogleProfile}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Skip for now
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
