import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../utils/roleBasedRouting';
import useAuthStore from '../stores/Zustand.store';

const AuthSlider = lazy(() => import('../components/AuthSlider'));

/**
 * Minimal tenant landing page for /:companyPath.
 * Full marketing content is available at /:companyPath/public.
 */
const TenantHome = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');

  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const heroImage = theme.heroImage || '/banner_one.jpg';
  const mobileHeroImage = theme.heroMobileImage || heroImage;

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

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Navbar minimalNav onSignInClick={openSignInSlider} onRegisterClick={openRegisterSlider} />
      {authSliderOpen ? (
        <Suspense fallback={null}>
          <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} initialTab={authInitialTab} />
        </Suspense>
      ) : null}

      <main className="bg-[#f6f1e7] pt-16 sm:pt-[72px]">
        <section className="relative w-full overflow-hidden border-y border-[#d9cfbf] bg-[#f9f6ee] pb-10 pt-6 sm:pb-14 sm:pt-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(31, 78, 69, 0.08) 1px, transparent 0),
                linear-gradient(120deg, rgba(31, 78, 69, 0.03), rgba(140, 118, 86, 0.03))
              `,
              backgroundSize: '20px 20px, 100% 100%',
            }}
          />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{ color: '#1f4e45', borderColor: '#c5b9a6', backgroundColor: '#fffdf7' }}
                  >
                    Healthy Cloud Kitchen
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-[1.02] text-[#183f38] sm:text-5xl lg:text-6xl">
                    Healthy Food.
                    <br />
                    Zero Effort.
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-[#2c5d54] sm:text-xl">
                    Built for Busy Days.
                  </p>
                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#5f5f57] sm:text-base">
                    Chef-crafted, high-energy healthy combos delivered to your doorstep in minutes.
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#2f5a51] sm:text-base">
                    Unlock today&apos;s exclusive menu instantly.
                  </p>

                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={openRegisterSlider}
                      className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(31,111,95,0.35)] transition hover:brightness-105 active:scale-[0.99]"
                      style={{ backgroundColor: '#1f6f5f' }}
                    >
                      👉 View Today&apos;s Menu
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-[#e4d9c7]/80 blur-2xl" />
                  <div className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-[#cde3d8]/70 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[28px] border border-[#d8cebe] bg-[#ece4d7] shadow-[0_20px_45px_rgba(27,66,58,0.18)]">
                    <picture>
                      <source media="(max-width: 640px)" srcSet={mobileHeroImage} />
                      <img
                        src={heroImage}
                        alt={`${theme.brandName || "Jay's Kerala Kitchen"} healthy meal`}
                        className="h-[360px] w-full object-cover sm:h-[430px] lg:h-[500px]"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#15352f]/35 via-transparent to-transparent" />
                  </div>
                </div>
            </div>
          </div>
        </section>

        <section className="relative w-full overflow-hidden border-y border-[#275447] bg-gradient-to-r from-[#143f34] via-[#1a4f41] to-[#143f34] px-4 py-14 text-center sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
          <div className="relative z-10 mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4e7dd]">
              Jay&apos;s Kerala Kitchen
            </p>
            <h2 className="mt-3 text-4xl font-black leading-[1.05] text-[#f3f1de] sm:text-5xl">
              Stop dieting.
              <br />
              Start eating smart.
            </h2>
            <p className="mt-4 text-sm text-[#d3e2da] sm:text-base">
              High protein. Low fat. Delivered daily. Zero excuses.
            </p>
            <button
              type="button"
              onClick={openRegisterSlider}
              className="mt-7 rounded-full bg-[#eef0d7] px-7 py-3 text-sm font-bold text-[#1f4e45] shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition hover:brightness-95"
            >
              Reserve Your Combo →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TenantHome;
