import React, { useState, useEffect, Suspense, lazy } from 'react';

const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
import { IoClose } from 'react-icons/io5';
import { useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';

/**
 * AuthSlider - Sliding authentication modal with tabbed interface
 * Handles login, registration, and password reset in a single modal
 * Features: Tab switching, form validation, success messages, responsive design
 * Uses tenant theme for tab colours (JLG green, jkfds orange).
 */
const AuthSlider = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginStartView, setLoginStartView] = useState('options');
  const [showForgot, setShowForgot] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const showMobileHeaderLogo = !(activeTab === 'login' && loginStartView === 'options' && !showForgot);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab === 'register' ? 'register' : 'login');
    setLoginStartView('options');
    setShowForgot(false);
    setSuccessMessage('');
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleSwitchToLogin = (event) => {
      setActiveTab('login');
      setLoginStartView('credentials');
      setShowForgot(false);
      setSuccessMessage(event.detail.message);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    };

    window.addEventListener('switchToLogin', handleSwitchToLogin);
    return () => window.removeEventListener('switchToLogin', handleSwitchToLogin);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slider Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div
            className="h-full flex flex-col shadow-xl"
            style={{ background: `linear-gradient(180deg, #0f172a 0%, #111827 52%, ${accent}1F 100%)` }}
          >
            {/* Header - theme accent for active tab */}
            <div className="px-4 py-6 bg-black/15 border-b border-white/15 sm:px-6 backdrop-blur-sm">
              <div className="hidden md:flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    onClick={() => { setActiveTab('login'); setLoginStartView('options'); setShowForgot(false); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md border-b-2 ${
                      activeTab === 'login' && !showForgot
                        ? ''
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                    style={activeTab === 'login' && !showForgot ? { color: accent, borderColor: accent } : undefined}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setActiveTab('register'); setShowForgot(false); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md border-b-2 ${
                      activeTab === 'register'
                        ? ''
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                    style={activeTab === 'register' ? { color: accent, borderColor: accent } : undefined}
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white focus:outline-none"
                >
                  <IoClose className="h-6 w-6" />
                </button>
              </div>
              <div className="md:hidden relative flex items-center justify-end min-h-[44px]">
                {showMobileHeaderLogo && (
                  <img
                    src={theme.logoUrl || '/logo.png'}
                    alt={theme.brandName || 'Company logo'}
                    className="absolute left-1/2 -translate-x-1/2 w-20 h-20 object-contain rounded-full"
                  />
                )}
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white focus:outline-none relative z-10"
                >
                  <IoClose className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-3 pb-1 sm:px-6 sm:py-5">
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {successMessage}
                  </div>
                )}
                <Suspense
                  fallback={
                    <div className="flex justify-center py-16 text-white/70 text-sm" aria-busy="true">
                      Loading…
                    </div>
                  }
                >
                  {showForgot ? (
                    <ForgotPassword onBackToLogin={() => setShowForgot(false)} accent={accent} />
                  ) : activeTab === 'login' ? (
                    <Login
                      onClose={onClose}
                      onForgotPassword={() => setShowForgot(true)}
                      startWithCredentials={loginStartView === 'credentials'}
                      onShowCredentials={() => setLoginStartView('credentials')}
                      onSwitchToRegister={() => {
                        setActiveTab('register');
                        setLoginStartView('options');
                        setShowForgot(false);
                      }}
                      accent={accent}
                    />
                  ) : (
                    <Register
                      accent={accent}
                      onClose={onClose}
                      onSwitchToLogin={() => {
                        setActiveTab('login');
                        setLoginStartView('credentials');
                        setShowForgot(false);
                      }}
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSlider; 