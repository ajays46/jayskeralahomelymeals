import { useState } from 'react';
import { z } from 'zod';
import { loginSchema, validateField } from '../validations/loginValidation';
import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/userHooks/useLogin';

const Login = ({ onClose, onForgotPassword }) => {
  // const { login } = useAuth();
  const { mutate: loginMutation, isPending } = useLogin();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(loginSchema, name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate all fields
      loginSchema.parse(formData);

      // If validation passes, proceed with login
      await loginMutation(formData, {
        onError: (error) => {
          const errorMessage = error.response?.data?.message;
          if (errorMessage?.toLowerCase().includes('invalid')) {
            setErrors(prev => ({ ...prev, password: 'Invalid credentials please try again' }));
          } else if (errorMessage?.toLowerCase().includes('not active')) {
            setErrors(prev => ({ ...prev, identifier: 'Your account is not active yet' }));
          } else {
            setErrors(prev => ({ ...prev, submit: errorMessage || 'Login failed' }));
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
      <h2 className="text-3xl font-bold text-gray-900 mb-4 lg:text-start text-center">Login to your account</h2>
      <div className="w-full max-w-md mx-auto p-6 pt-0 lg:pt-6 md:bg-white md:rounded-xl md:shadow-md">
        <p className="text-gray-500 mb-6 text-sm">Welcome back! Please login to your account</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">Email or Phone Number</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              className={`block w-full rounded-lg border ${errors.identifier ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900`}
              placeholder="Enter your email or phone number"
              value={formData.identifier}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isPending}
            />
            {errors.identifier && <p className="mt-1 text-sm text-red-500">{errors.identifier}</p>}
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
              disabled={isPending}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isPending}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.221-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
              )}
            </button>
            {errors.password && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {errors.password}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-gray-300 rounded"
                disabled={isPending}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-orange-500 hover:underline bg-transparent border-none p-0"
              onClick={onForgotPassword}
              disabled={isPending}
            >
              Forgot password?
            </button>
          </div>
          {errors.submit && <p className="mt-1 text-sm text-red-500">{errors.submit}</p>}
          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg shadow-md transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">Or sign in with</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <div className="flex justify-center gap-4 mb-4">
          <button className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-6 w-6" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Login; 