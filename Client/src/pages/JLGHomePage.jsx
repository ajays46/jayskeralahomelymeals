/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { getDashboardRoute, resolveSelectedRoleForDashboard } from '../utils/roleBasedRouting';
import useAuthStore from '../stores/Zustand.store';

/**
 * Jay's Leafy Greens — classic marketing landing: hero, featured product grid, full navbar.
 * Other tenants use HomePage (minimal). Footer remains global in App.
 */
const JLGHomePage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#10b981';
  const gradient = theme.homeGradient || 'from-emerald-50 via-white to-teal-50';

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

  const featuredProducts = theme.featuredProducts ?? [];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
      <Navbar onSignInClick={openSignInSlider} onRegisterClick={openRegisterSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={closeAuthSlider} initialTab={authInitialTab} />

      <div className="relative overflow-hidden">
        <div
          className="bg-cover bg-center bg-no-repeat h-64 sm:h-80 md:h-96 lg:h-[400px] xl:h-[500px] flex items-center justify-center pt-16 sm:pt-18 md:pt-20 lg:pt-22"
          style={{ backgroundImage: `url('${theme.heroImage || '/JLG.png'}')` }}
        >
          <div className="absolute inset-0 bg-black/40 sm:bg-black/35 md:bg-black/30" />
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
            <div className="text-left sm:text-center max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto pl-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {theme.heroTitle || 'Fresh & Healthy'}
                <span className="block mt-1 sm:mt-2" style={{ color: accent }}>
                  {theme.heroSubtitle || 'Leafy Greens'}
                </span>
              </h1>
              <p className="hidden sm:block text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-4">
                {theme.heroDescription ||
                  'Experience the goodness of fresh micro greens—nutrient-packed, sustainably grown.'}
              </p>
              <div className="flex flex-row gap-3 sm:gap-4 justify-start sm:justify-center items-start sm:items-center">
                <Link to={`${base}/menu`} className="w-auto">
                  <button
                    type="button"
                    className="w-auto bg-white hover:bg-gray-100 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                    style={{ color: accent }}
                  >
                    Explore Menu
                  </button>
                </Link>
                <button
                  type="button"
                  className="w-auto border-2 border-white text-white hover:bg-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all duration-300"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = accent;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = 'white';
                  }}
                  onClick={openSignInSlider}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 lg:py-20 bg-white relative">
        <div className="absolute inset-0 bg-[url('/pattern.jpg')] bg-repeat opacity-5" />
        <div className="relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {theme.featuredSectionTitle || 'Our Fresh Selection'}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {theme.featuredSectionSubtitle ||
                  'Explore our carefully curated selection of fresh micro greens and leafy options.'}
              </p>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {featuredProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
                  >
                    <div className="relative overflow-hidden aspect-square">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 sm:p-4 text-center">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default JLGHomePage;
