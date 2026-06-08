import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { IoClose } from 'react-icons/io5';
import { useTenant } from '../context/TenantContext';
import {
  getThemeForCompany,
  getAuthAccentColor,
  getAuthHeadingColor,
  getAuthFormPanelBg,
} from '../config/tenantThemes';

/**
 * AuthSlider - Sliding authentication panel from the right.
 * Inner forms use the reference layout and tenant theme colours.
 */
const AuthSlider = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [showForgot, setShowForgot] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = getAuthAccentColor(theme);
  const headingColor = getAuthHeadingColor(theme);
  const formPanelBg = getAuthFormPanelBg(theme);

  const authTheme = { accent, headingColor, formPanelBg };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'register' ? 'register' : 'login');
      setShowForgot(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleSwitchToLogin = (event) => {
      setActiveTab('login');
      setShowForgot(false);
      setSuccessMessage(event.detail.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    };

    window.addEventListener('switchToLogin', handleSwitchToLogin);
    return () => window.removeEventListener('switchToLogin', handleSwitchToLogin);
  }, []);

  if (!isOpen) return null;

  const heading = showForgot
    ? 'Forgot Password?'
    : activeTab === 'login'
      ? 'Sign In to your account'
      : 'Create an Account';

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header tabs */}
            <div className="px-4 py-6 bg-white border-b border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  {!showForgot ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('login'); setShowForgot(false); }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                          activeTab === 'login'
                            ? ''
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                        style={activeTab === 'login' ? { color: accent, borderColor: accent } : undefined}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('register'); setShowForgot(false); }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                          activeTab === 'register'
                            ? ''
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                        style={activeTab === 'register' ? { color: accent, borderColor: accent } : undefined}
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <span className="px-4 py-2 text-sm font-semibold text-gray-500">Reset password</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label="Close"
                >
                  <IoClose className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 sm:px-6">
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-5 lg:text-start text-center"
                  style={{ color: headingColor }}
                >
                  {heading}
                </h2>

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}

                {showForgot ? (
                  <ForgotPassword onBackToLogin={() => setShowForgot(false)} {...authTheme} />
                ) : activeTab === 'login' ? (
                  <Login
                    onClose={onClose}
                    onForgotPassword={() => setShowForgot(true)}
                    onSwitchToRegister={() => setActiveTab('register')}
                    {...authTheme}
                  />
                ) : (
                  <Register
                    onSwitchToLogin={() => setActiveTab('login')}
                    onClose={onClose}
                    {...authTheme}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSlider;
