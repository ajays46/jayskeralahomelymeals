/**
 * MLHomePage - MaXHub Logistics landing. Minimal hero + Sign In (AuthSlider).
 * If user is logged in, redirect by role to /ml/dashboard or /ml/cxo-dashboard.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MLNavbar from '../components/MLNavbar';
import AuthSlider from '../../components/AuthSlider';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
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

  useEffect(() => {
    if (user && roles && roles.length > 0) {
      const dashboardRoute = getDashboardRoute(roles, base);
      if (dashboardRoute && dashboardRoute !== base) {
        navigate(dashboardRoute, { replace: true });
      }
    }
  }, [user, roles, base, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <MLNavbar onSignInClick={() => setAuthSliderOpen(true)} />
      <AuthSlider isOpen={authSliderOpen} onClose={() => setAuthSliderOpen(false)} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {theme.heroTitle || 'MaXHub'}
            <span className="block mt-2" style={{ color: accent }}>{theme.heroSubtitle || 'Logistics'}</span>
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            {theme.heroDescription || 'Logistics platform for delivery partners and operations.'}
          </p>
          {!user && (
            <button
              onClick={() => setAuthSliderOpen(true)}
              className="px-8 py-3 rounded-full font-semibold text-white shadow-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
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
