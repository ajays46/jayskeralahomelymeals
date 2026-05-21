/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiCheckCircle, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import Terms from '../components/Terms';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../utils/roleBasedRouting';
import useAuthStore from '../stores/Zustand.store';
import { showSuccessToast, showValidationError } from '../utils/toastConfig';
import { useCompleteGoogleProfile } from '../hooks/userHooks/useCompleteGoogleProfile';

/**
 * HomePage — Kerala marketing landing with banner hero and inline newsletter cards.
 * Footer remains global in App (ConditionalFooter). Logged-in users redirect to role dashboard.
 */
const MOBILE_PATTERN = /^\d{10}$/;

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

const HomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [heroPrompt, setHeroPrompt] = useState('');
  const [quickOrderSheetOpen, setQuickOrderSheetOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
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
  const shouldUseCustomerMenu = useMemo(() => {
    if (!user) return false;
    if (!hasUserPhone || user?.termsAccepted !== true) return false;

    const roleArray = Array.isArray(roles) ? roles : roles ? [roles] : [];
    const normalizedRoles = roleArray
      .map((role) => String(role || '').toUpperCase())
      .filter(Boolean);

    // Keep operational/admin roles on their own dashboards, not the customer menu.
    const hasOperationalRole = normalizedRoles.some((role) => (
      [
        'CEO',
        'CFO',
        'ADMIN',
        'DELIVERY_MANAGER',
        'SELLER',
        'DELIVERY_EXECUTIVE',
        'DELIVERY_PARTNER',
        'PARTNER_MANAGER',
      ].includes(role)
    ));

    return !hasOperationalRole;
  }, [user, hasUserPhone, user?.termsAccepted, roles]);
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

  useEffect(() => {
    if (!user || !roles || roles.length === 0) return;
    if (showRoleSelector) return;
    const selected = resolveSelectedRoleForDashboard(roles, activeRole, base);
    const dashboardRoute = getDashboardRoute(roles, base, selected);
    if (dashboardRoute && dashboardRoute !== base) {
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, roles, base, navigate, activeRole, showRoleSelector]);

  useEffect(() => {
    if (!shouldUseCustomerMenu) return;
    navigate(`${base}/menu`, { replace: true });
  }, [shouldUseCustomerMenu, navigate, base]);

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
          showSuccessToast('Your profile is updated. Continue to the menu.', 'Done');
          setLeadForm({ mobile: '', termsAccepted: false });
          setQuickOrderSheetOpen(false);
          navigate(`${base}/menu`);
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
