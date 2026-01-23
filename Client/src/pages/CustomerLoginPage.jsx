import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdPerson, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';
import useAuthStore from '../stores/Zustand.store';

/**
 * CustomerLoginPage - Login page for customers to access their orders
 * Allows customers to login with phone number and password
 * Features: Phone/password login, validation, secure authentication
 */
const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const { setAccessToken } = useAuthStore();
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Get token from URL if provided
  useEffect(() => {
    // Support both 't' (short token) and 'token' (legacy JWT) parameters
    const urlToken = searchParams.get('t') || searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      fetchCustomerInfo(urlToken);
    }
  }, [searchParams]);

  // Fetch customer info if token provided
  const fetchCustomerInfo = async (urlToken) => {
    try {
      // Use dev API URL for localhost, prod for production
      const baseURL = import.meta.env.VITE_NODE_ENV === 'development' 
        ? (import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000')
        : import.meta.env.VITE_PROD_API_URL 
      const response = await axios.get(`${baseURL}/customer-portal/validate-token?token=${urlToken}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCustomerInfo(data);
        
        // Pre-fill phone number if available
        if (data.phoneNumber) {
          setFormData(prev => ({ ...prev, phoneNumber: data.phoneNumber }));
        }
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
      // If token validation fails, user can still login manually
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

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      // Use dev API URL for localhost, prod for production
      const baseURL = import.meta.env.VITE_NODE_ENV === 'development' 
        ? (import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000')
        : import.meta.env.VITE_PROD_API_URL
      
      // Login using phone number as identifier
      const response = await axios.post(`${baseURL}/auth/login`, {
        identifier: formData.phoneNumber,
        password: formData.password
      });

      if (response.data.success) {
        // Store auth token in both localStorage and Zustand store
        const accessToken = response.data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        setAccessToken(accessToken);
        
        showSuccessToast('Login successful! Redirecting...');
        
        // Redirect to customer orders page
        setTimeout(() => {
          navigate('/customer-portal');
        }, 1500);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      if (errorMessage.toLowerCase().includes('invalid')) {
        setErrors({ password: 'Invalid phone number or password' });
      } else if (errorMessage.toLowerCase().includes('setup')) {
        showErrorToast('Please set up your password first using the access link');
        navigate('/customer-portal');
      } else {
        showErrorToast(errorMessage);
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MdPerson className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          {customerInfo && (
            <p className="text-gray-600">
              Welcome back, <span className="font-semibold text-gray-900">{customerInfo.customerName}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Login to view your orders and delivery status
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  className={`block w-full rounded-lg border ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
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
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
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
              disabled={loading}
              className={`w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-md transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MdLock className="w-5 h-5" />
                  Login
                </span>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            {/* <button
              type="button"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              onClick={() => alert('Please contact your seller to reset your password')}
            >
              Forgot your password?
            </button> */}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact your seller</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;

