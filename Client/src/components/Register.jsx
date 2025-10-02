import { useState } from 'react';
import Terms from './Terms';
import { z } from 'zod';
import { registerSchema, validateField } from '../validations/registerValidation';
import { useRegister } from '../hooks/userHooks/useRegister';

/**
 * Register - User registration form component with validation
 * Handles new user registration with email, phone, and password validation
 * Features: Form validation, terms agreement, password visibility toggle, error handling
 */
const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const { mutate: register, isPending } = useRegister();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    const error = validateField(registerSchema, name, fieldValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate all fields
      registerSchema.parse(formData);

      // Add default name based on email
      const registrationData = {
        ...formData,
        name: formData.email.split('@')[0] // Use part of email as default name
      };

      // If validation passes, proceed with registration
      register(registrationData, {
        onSuccess: () => {
          // Show success message and switch to login form
          setFormData({
            email: '',
            phone: '',
            password: '',
            agree: false,
          });
          setErrors({});
          // Emit an event to switch to login form
          const switchToLoginEvent = new CustomEvent('switchToLogin', {
            detail: { message: 'Registration successful! Please login.' }
          });
          window.dispatchEvent(switchToLoginEvent);
        },
        onError: (error) => {
          const message = error.response?.data?.message || '';

          if (message.includes('Email already registered')) {
            setErrors({ email: 'This email is already registered. Please login instead.' });
          } else if (message.includes('phone number is already registered')) {
            setErrors({ phone: 'This phone number is already registered. Please login instead.' });
          } else if (error.response?.data?.errors) {
            setErrors(error.response.data.errors);
          } else {
            setErrors({ submit: 'Registration failed. Please try again.' });
          }
        }

      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900 mb-4 lg:text-start text-center">Create an Account</h2>
      <div className="w-full max-w-md mx-auto p-6 pt-0 lg:pt-6 md:bg-white md:rounded-xl md:shadow-md">
        <p className="text-gray-500 mb-6 text-sm">Create an account to start looking for the food you like</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`block w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900`}
              placeholder="Albertstevano@gmail.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.email && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {errors.email}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={`block w-full rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900`}
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.phone && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {errors.phone}
              </div>
            )}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`block w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 pr-10`}
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.221-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
              )}
            </button>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>
          <div className="flex items-center mb-2">
            <input
              id="agree"
              name="agree"
              type="checkbox"
              checked={formData.agree}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`h-4 w-4 text-orange-500 focus:ring-orange-400 border-gray-300 rounded ${errors.agree ? 'border-red-500' : ''}`}
              required
            />
            <label htmlFor="agree" className="ml-2 text-sm text-gray-700">
              I Agree with <button type="button" onClick={() => setShowTerms(true)} className="text-orange-500 font-medium hover:underline">Terms of Service</button> and <a href="#" className="text-orange-500 font-medium hover:underline">Privacy Policy</a>
            </label>
          </div>
          {errors.agree && <p className="mt-1 text-sm text-red-500">{errors.agree}</p>}
          {errors.submit && <p className="mt-1 text-sm text-red-500">{errors.submit}</p>}
          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg shadow-md transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPending ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">Or sign in with</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <div className="flex justify-center gap-4 mb-4">
          <button className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-6 w-6" /></button>
        </div>
        <Terms isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </div>
    </>
  );
};

export default Register; 