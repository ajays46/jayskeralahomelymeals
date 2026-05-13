/**
 * MLHomePage - MaXHub Logistics landing. Minimal hero + Sign In (AuthSlider).
 * If user is logged in, redirect by role to /ml/dashboard or /ml/cxo-dashboard.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MLNavbar from '../components/MLNavbar';
import AuthSlider from '../../components/AuthSlider';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../../utils/roleBasedRouting';
import useAuthStore from '../../stores/Zustand.store';

const MLHomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={openAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} />

      <div className="pt-24 sm:pt-28 pb-24 px-4 max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {theme.heroTitle || 'MaXHub'}
            <span className="block mt-1" style={{ color: accent }}>{theme.heroSubtitle || 'Logistics'}</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8">
            {theme.heroDescription || 'Logistics platform for delivery partners and operations.'}
          </p>
          {!user && (
            <button
              onClick={openAuthSlider}
              className="min-h-[48px] px-8 py-3 rounded-2xl font-semibold text-white shadow-lg active:scale-[0.98] transition-transform text-base"
              style={{ backgroundColor: accent }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLHomePage;
