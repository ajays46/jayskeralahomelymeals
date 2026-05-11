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

/**
 * HomePage — ML-style minimal landing: gradient, centered copy, Sign In opens AuthSlider (Login/Register).
 * Footer remains global in App (ConditionalFooter). Logged-in users redirect to role dashboard.
 */
const HomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
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

  const openAuthSlider = useCallback(() => setAuthSliderOpen(true), []);
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
      className={`min-h-screen bg-gradient-to-br ${gradient} flex flex-col`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Navbar minimalNav onSignInClick={openAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} />

      <main className="flex-1 flex flex-col">
        <div className="pt-24 sm:pt-28 pb-24 px-4 max-w-md mx-auto w-full flex-1 flex flex-col">
          <div className="text-center flex-1 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {theme.heroTitle || 'Welcome'}
              <span className="block mt-1" style={{ color: accent }}>
                {theme.heroSubtitle || theme.brandName || 'Kitchen Service'}
                        </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-8">
              {theme.heroDescription ||
                'Sign in to order, manage your plan, and explore our menu — authentic Kerala kitchen service.'}
            </p>
            {!user && (
                  <button
                type="button"
                onClick={openAuthSlider}
                className="min-h-[48px] px-8 py-3 rounded-2xl font-semibold text-white shadow-lg active:scale-[0.98] transition-transform text-base mx-auto"
                style={{ backgroundColor: accent }}
              >
                Sign In
                  </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
