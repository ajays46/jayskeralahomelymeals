import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { IoClose } from 'react-icons/io5';
import { useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';

/**
 * AuthSlider - Sliding authentication modal with tabbed interface
 * Handles login, registration, and password reset in a single modal
 * Features: Tab switching, form validation, success messages, responsive design
 * Uses tenant theme for tab colours (JLG green, JKHM orange).
 */
const AuthSlider = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [showForgot, setShowForgot] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';

  useEffect(() => {
    const handleSwitchToLogin = (event) => {
      setActiveTab('login');
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
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header - theme accent for active tab */}
            <div className="px-4 py-6 bg-white border-b border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    onClick={() => { setActiveTab('login'); setShowForgot(false); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md border-b-2 ${
                      activeTab === 'login' && !showForgot
                        ? ''
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === 'login' && !showForgot ? { color: accent, borderColor: accent } : undefined}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setActiveTab('register'); setShowForgot(false); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md border-b-2 ${
                      activeTab === 'register'
                        ? ''
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === 'register' ? { color: accent, borderColor: accent } : undefined}
                  >
                    Register
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <IoClose className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 sm:px-6">
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {successMessage}
                  </div>
                )}
                {showForgot ? (
                  <ForgotPassword onBackToLogin={() => setShowForgot(false)} accent={accent} />
                ) : activeTab === 'login' ? (
                  <Login onClose={onClose} onForgotPassword={() => setShowForgot(true)} accent={accent} />
                ) : (
                  <Register accent={accent} />
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