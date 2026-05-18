/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../utils/roleBasedRouting';
import useAuthStore from '../stores/Zustand.store';
import { showSuccessToast, showValidationError } from '../utils/toastConfig';

/**
 * HomePage — Kerala marketing landing with banner hero and inline newsletter cards.
 * Footer remains global in App (ConditionalFooter). Logged-in users redirect to role dashboard.
 */
const MOBILE_PATTERN = /^\d{10}$/;

const NEWSLETTER_VARIANTS = [
  {
    key: 'freeDelivery',
    title: "JAY'S KERALA KITCHEN",
    subtitle: 'FOOD DELIVERY SERVICE',
    highlight: 'HUNGRY? 🔥',
    message:
      'Get Free Delivery On Your First Order! Join our Premium list to claim your free delivery code, plus receive our weekly rotating Veg & Non-Veg menus every Sunday night.',
    namePlaceholder: 'Enter your Name...',
    mobilePlaceholder: 'Enter Mobile Number (for WhatsApp/SMS codes)',
    consentLabel: 'Send my discount code and weekly menus via WhatsApp',
    requiresName: true,
    requiresConsent: true,
    cta: 'CLAIM MY FREE DELIVERY',
    ctaClass:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)]',
    finePrint: 'No spam. Just hot, home-cooked Kerala food.',
  },
  {
    key: 'biryaniAlert',
    title: "JAY'S KERALA KITCHEN",
    subtitle: 'FOOD DELIVERY SERVICE',
    highlight: '🍛 NEVER MISS BIRYANI WEDNESDAY! 🍛',
    message:
      "Our delicious Chicken & Veg Biryanis sell out fast every Wednesday! Don't miss out on your favorite mid-week treat. Sign up to get next week's menu sent straight to your phone via WhatsApp every Sunday evening before anyone else.",
    mobilePlaceholder: 'Enter Mobile Number...',
    consentLabel: 'Remind me on WhatsApp before Biryani sells out!',
    requiresConsent: true,
    cta: 'SEND ME WHATSAPP ALERTS',
    ctaClass:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)]',
    finePrint: '*Note: We deliver fresh daily. Consume food within 2 hours of delivery.',
  },
];

const HomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [newsletterForms, setNewsletterForms] = useState({
    freeDelivery: { name: '', mobile: '', preference: 'vegetarian', consent: true },
    biryaniAlert: { name: '', mobile: '', preference: 'vegetarian', consent: true },
    weeklyDeals: { name: '', mobile: '', preference: 'vegetarian', consent: true },
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

  const openSignInSlider = useCallback(() => {
    setAuthInitialTab('login');
    setAuthSliderOpen(true);
  }, []);
  const openRegisterSlider = useCallback(() => {
    setAuthInitialTab('register');
    setAuthSliderOpen(true);
  }, []);
  const closeAuthSlider = useCallback(() => setAuthSliderOpen(false), []);

  useEffect(() => {
    if (!user || !roles || roles.length === 0) return;
    if (showRoleSelector) return;
    const selected = resolveSelectedRoleForDashboard(roles, activeRole, base);
    const dashboardRoute = getDashboardRoute(roles, base, selected);
    if (dashboardRoute && dashboardRoute !== base) {
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, roles, base, navigate, activeRole, showRoleSelector]);

  const updateNewsletterForm = useCallback((variant, field, value) => {
    setNewsletterForms((prev) => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [field]: value,
      },
    }));
  }, []);

  const submitNewsletter = useCallback((event, variantConfig) => {
    event.preventDefault();
    const variant = variantConfig.key;
    const form = newsletterForms[variant];
    const mobile = String(form?.mobile || '').replace(/\D/g, '');

    if (variantConfig.requiresName && !(form?.name || '').trim()) {
      showValidationError('Please enter your name.');
      return;
    }
    if (!MOBILE_PATTERN.test(mobile)) {
      showValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (variantConfig.requiresConsent && !form?.consent) {
      showValidationError('Please check the WhatsApp/SMS consent option to continue.');
      return;
    }

    showSuccessToast('You are subscribed. We will keep you updated on WhatsApp/SMS.', 'Thank you!');

    setNewsletterForms((prev) => ({
      ...prev,
      [variant]: {
        name: '',
        mobile: '',
        preference: variantConfig.showPreference ? prev[variant].preference : 'vegetarian',
        consent: true,
      },
    }));
  }, [newsletterForms]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${gradient}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Navbar minimalNav onSignInClick={openSignInSlider} onRegisterClick={openRegisterSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} initialTab={authInitialTab} />

      <main>
        <section className="relative overflow-hidden">
          <div
            className="bg-cover bg-center bg-no-repeat h-[300px] sm:h-[340px] md:h-[390px] lg:h-[430px] flex items-center justify-center pt-16 sm:pt-20"
            style={{ backgroundImage: `url('${theme.heroImage || '/banner_one.jpg'}')` }}
          >
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
                {theme.heroTitle || 'Discover Authentic'}
                <span
                  className={`block mt-1 ${theme.brandDisplayFontClass || ''}`}
                  style={{ color: theme.brandDisplayColor || accent }}
                >
                  {theme.heroSubtitle || 'Kerala Cuisine'}
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                {theme.heroDescription ||
                  "Experience the rich flavors and traditional recipes from God's Own Country. From spicy curries to aromatic rice dishes, every bite tells a story."}
              </p>
            </div>
          </div>
        </section>

        <section className="relative py-10 sm:py-12 lg:py-14 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.jpg')] bg-repeat opacity-5 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto">
            <div
              className="max-w-6xl mx-auto mb-8 rounded-2xl border border-yellow-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5 lg:gap-6 items-center">
                <div className="text-center lg:text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">JAY&apos;S KERALA KITCHEN</h3>
                  <p className="mt-1 text-xs sm:text-sm font-semibold tracking-wider text-gray-600 uppercase">
                    FOOD DELIVERY SERVICE
                  </p>
                  <p className="mt-3 text-lg sm:text-2xl font-bold text-gray-900">
                    🥗 EAT CLEAN. FEEL LIGHT. STAY NOURISHED. 🥗
                  </p>
                  <p className="mt-2 text-sm sm:text-base text-gray-700 leading-relaxed">
                  Subscribe to our weekly WhatsApp menu updates and enjoy balanced, hygienic, home-cooked
                  Kerala meals made fresh daily to support your health and energy.
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-2xl border border-white p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={openRegisterSlider}
                    className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm sm:text-base font-bold text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:bg-yellow-300"
                  >
                    SUBSCRIBE &amp; ORDER NOW →
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Get weekly menus and offers directly on WhatsApp/SMS.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {NEWSLETTER_VARIANTS.map((variant) => {
                const form = newsletterForms[variant.key];
                return (
                  <form
                    key={variant.key}
                    onSubmit={(event) => submitNewsletter(event, variant)}
                    className="rounded-2xl bg-white shadow-lg border border-gray-100 p-5 sm:p-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 lg:gap-6 items-start">
                      <div className="text-center lg:text-left">
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">{variant.title}</h3>
                        <p className="mt-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                          {variant.subtitle}
                        </p>
                        <p className="mt-3 text-lg font-bold text-gray-900">{variant.highlight}</p>
                        <p className="mt-3 text-sm leading-relaxed text-gray-700">{variant.message}</p>
                        {variant.finePrint ? (
                          <p className="mt-3 text-xs text-gray-500">{variant.finePrint}</p>
                        ) : null}
                      </div>

                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                        {variant.requiresName ? (
                          <input
                            type="text"
                            value={form.name}
                            onChange={(event) => updateNewsletterForm(variant.key, 'name', event.target.value)}
                            placeholder={variant.namePlaceholder}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            autoComplete="name"
                            required
                          />
                        ) : null}

                        <div className={`${variant.requiresName ? 'mt-3' : ''} flex items-center gap-2`}>
                          <span className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700">
                            +91
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={form.mobile}
                            onChange={(event) => updateNewsletterForm(variant.key, 'mobile', event.target.value)}
                            placeholder={variant.mobilePlaceholder}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            required
                          />
                        </div>

                        {variant.showPreference ? (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700">Choose your preference:</p>
                            <div className="mt-2 space-y-2">
                              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={`dietPreference-${variant.key}`}
                                  value="vegetarian"
                                  checked={form.preference === 'vegetarian'}
                                  onChange={() => updateNewsletterForm(variant.key, 'preference', 'vegetarian')}
                                />
                                <span>🟢 Vegetarian Only</span>
                              </label>
                              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={`dietPreference-${variant.key}`}
                                  value="mixed"
                                  checked={form.preference === 'mixed'}
                                  onChange={() => updateNewsletterForm(variant.key, 'preference', 'mixed')}
                                />
                                <span>🔴 Non-Vegetarian / Mix</span>
                              </label>
                            </div>
                          </div>
                        ) : null}

                        {variant.requiresConsent ? (
                          <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={Boolean(form.consent)}
                              onChange={(event) =>
                                updateNewsletterForm(variant.key, 'consent', event.target.checked)
                              }
                              className="mt-1"
                            />
                            <span>{variant.consentLabel}</span>
                          </label>
                        ) : null}

                        <button
                          type="submit"
                          className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${variant.ctaClass}`}
                        >
                          {variant.cta}
                        </button>
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
