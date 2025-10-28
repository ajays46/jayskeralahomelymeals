import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';

/**
 * CustomerPasswordSetupPage - Password setup page for customers
 * Allows customers to set their password when accessing the portal for the first time
 * Features: Password validation, confirmation matching, secure token validation
 */
const CustomerPasswordSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    
    if (!urlToken) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    setToken(urlToken);
    fetchCustomerInfo(urlToken);
  }, [searchParams]);

  // Fetch customer info to verify token
  const fetchCustomerInfo = async (urlToken) => {
    try {
      setLoading(true);
      setError(null);
      
      const baseURL = import.meta.env.VITE_PROD_API_URL
      const response = await axios.get(`${baseURL}/customer-portal/validate-token?token=${urlToken}`);
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Check if password already set up
        if (!data.needsPasswordSetup) {
          // Password already set up, redirect to login
          navigate(`/customer-login?token=${urlToken}`);
          return;
        }
        
        setCustomerInfo(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
      setError(error.response?.data?.message || 'Failed to validate access token');
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate password
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      setSetupLoading(true);
      const baseURL = import.meta.env.VITE_PROD_API_URL
      
      const response = await axios.post(
        `${baseURL}/customer-portal/setup-password?token=${token}`,
        { password: formData.password }
      );

      if (response.data.success) {
        showSuccessToast('Password set successfully! Redirecting to login...');
        
        // Redirect to login page with token
        setTimeout(() => {
          navigate(`/customer-login?token=${token}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error setting up password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to setup password';
      showErrorToast(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Validating access...</h3>
          <p className="text-gray-500">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-2xl text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/jkhm')}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MdLock className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Your Password</h1>
          <p className="text-gray-600">
            Welcome, <span className="font-semibold text-gray-900">{customerInfo?.customerName || 'Customer'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Create a secure password to access your orders
          </p>
        </div>

        {/* Password Setup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={setupLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={setupLoading}
                >
                  {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`block w-full rounded-lg border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={setupLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={setupLoading}
                >
                  {showConfirmPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Password Requirements */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Password requirements:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <span>• At least 6 characters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• Contains uppercase letter</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• Contains lowercase letter</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• Contains number</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={setupLoading}
              className={`w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-md transition-all ${
                setupLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {setupLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Setting up password...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MdCheckCircle className="w-5 h-5" />
                  Set Password
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>This link expires in 24 hours or after you set your password</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerPasswordSetupPage;

