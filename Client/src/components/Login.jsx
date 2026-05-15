import { useState, useLayoutEffect, useEffect } from 'react';
import { z } from 'zod';
import { loginSchema, validateField } from '../validations/loginValidation';
import { GoogleLogin } from '@react-oauth/google';
import { useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { useLogin, getRememberedIdentifier } from '../hooks/userHooks/useLogin';
import { useGoogleAuth } from '../hooks/userHooks/useGoogleAuth';
import CaptchaField from './CaptchaField';

/**
 * Login - Authentication form component with validation and error handling
 * Handles user login with email/phone, password validation, and form state management
 * Features: Form validation, password visibility toggle, error handling, loading states
 * @param {() => void} [onSwitchToRegister] - When set (e.g. AuthSlider), shows “Register” link to open registration tab.
 */
const Login = ({ onClose, onForgotPassword, onSwitchToRegister, accent: accentProp, startWithCredentials = false, onShowCredentials }) => {
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const { mutate: loginMutation, isPending } = useLogin();
  const { mutate: googleAuthMutation, isPending: isGooglePending } = useGoogleAuth();
  const accent = accentProp || '#FE8C00';
  const brandName = theme?.brandName || "Jay's Kerala Kitchen";
  const logoUrl = theme?.logoUrl || '/logo.png';
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaData, setCaptchaData] = useState({ captchaToken: '' });
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);
  const [showCredentialFormMobile, setShowCredentialFormMobile] = useState(false);
  /**
   * When a remembered email is restored, password stays read-only until focus so the browser
   * does not auto-fill the password. Users without a saved identifier are unaffected.
   */
  const [passwordUnlocked, setPasswordUnlocked] = useState(true);

  useLayoutEffect(() => {
    // Per-company only: never fall back to global when URL has a tenant (avoids jkfds email on JLG / ML).
    const saved = tenant?.companyPath
      ? getRememberedIdentifier(tenant.companyPath)
      : getRememberedIdentifier('');
    if (!saved) return;
    setPasswordUnlocked(false);
    setFormData((prev) => ({
      ...prev,
      identifier: saved,
      password: '',
      remember: true,
    }));
  }, [tenant?.companyPath]);

  useEffect(() => {
    setShowCredentialFormMobile(Boolean(startWithCredentials));
  }, [startWithCredentials]);

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
    const { name, value } = e.target;
    const error = validateField(loginSchema, name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate all fields
      loginSchema.parse(formData);
      if (showCaptcha && !captchaData.captchaToken) {
        setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
        return;
      }

      // If validation passes, proceed with login (include companyPath for phone login per company)
      loginMutation({
        ...formData,
        companyPath: tenant?.companyPath,
        captchaToken: captchaData.captchaToken
      }, {
        onSuccess: (data) => {
          if (data?.success) {
            setFailedAttempts(0);
            setShowCaptcha(false);
            setCaptchaData({ captchaToken: '' });
            onClose?.();
          }
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message;
          const requireCaptcha = Boolean(error.response?.data?.details?.requireCaptcha);
          const isInvalidCreds = errorMessage?.toLowerCase().includes('invalid');

          if (isInvalidCreds) {
            setFailedAttempts((prev) => {
              const next = prev + 1;
              if (next >= 3) setShowCaptcha(true);
              return next;
            });
          }
          if (requireCaptcha) {
            setShowCaptcha(true);
          }

          if (errorMessage?.toLowerCase().includes('invalid')) {
            setErrors(prev => ({ ...prev, password: 'Invalid credentials please try again' }));
          } else if (errorMessage?.toLowerCase().includes('captcha')) {
            setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
          } else if (errorMessage?.toLowerCase().includes('not active')) {
            setErrors(prev => ({ ...prev, identifier: 'Your account is not active yet' }));
          } else {
            setErrors(prev => ({ ...prev, submit: errorMessage || 'Sign-in failed' }));
          }
          if (showCaptcha || requireCaptcha) {
            setCaptchaData({ captchaToken: '' });
            setCaptchaRenderKey(prev => prev + 1);
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

  const handleGoogleSuccess = (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setErrors(prev => ({ ...prev, submit: 'Google sign-in failed. Missing credential.' }));
      return;
    }
    googleAuthMutation(
      {
        credential,
        companyPath: tenant?.companyPath,
        remember: true
      },
      {
        onSuccess: () => {
          onClose?.();
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message || 'Google sign-in failed';
          setErrors(prev => ({ ...prev, submit: errorMessage }));
        }
      }
    );
  };

  return (
    <>
      <h2 className="hidden md:block text-3xl font-bold text-gray-900 mb-5 text-center">Sign In to your account</h2>
      <div className="w-full max-w-md mx-auto p-6 pt-0 lg:pt-6 md:bg-white md:rounded-xl md:shadow-md" style={{ ['--auth-accent']: accent }}>
        <div className="hidden md:flex justify-center gap-4 mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrors(prev => ({ ...prev, submit: 'Google sign-in failed. Please try again.' }))}
            text="signin_with"
            shape="pill"
          />
        </div>

        {/* Mobile-first auth options: Google -> credentials -> create account */}
        {!showCredentialFormMobile && (
          <div className="md:hidden space-y-4 mb-4">
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={logoUrl}
                alt={`${brandName} logo`}
                className="w-20 h-20 object-contain rounded-full shadow-sm mb-3"
              />
              <h3 className="text-2xl font-bold text-gray-900">{brandName}</h3>
              {theme?.brandSubtitle ? (
                <p className="text-sm text-gray-500 mt-1">{theme.brandSubtitle}</p>
              ) : null}
            </div>
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrors(prev => ({ ...prev, submit: 'Google sign-in failed. Please try again.' }))}
                text="signin_with"
                shape="pill"
                width="320"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCredentialFormMobile(true);
                onShowCredentials?.();
              }}
              className="w-full py-3 rounded-xl text-white font-semibold text-base shadow-md transition-colors"
              style={{ backgroundColor: accent }}
            >
              Sign in with Email or phone number
            </button>
            <button
              type="button"
              onClick={() => onSwitchToRegister?.()}
              disabled={!onSwitchToRegister}
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-base bg-white"
            >
              Create an account
            </button>
          </div>
        )}

        <form className={`${showCredentialFormMobile ? 'block' : 'hidden md:block'} space-y-4 mt-1`} onSubmit={handleSubmit}>
          {showCredentialFormMobile && (
            <div className="md:hidden mb-3">
              <h3 className="text-2xl font-bold text-gray-900 text-center">Sign In to your account</h3>
            </div>
          )}
          <div className="mt-1">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
              Email or Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              className={`block w-full rounded-lg border ${errors.identifier ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900`}
              placeholder="Enter your email or phone number"
              value={formData.identifier}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isPending || isGooglePending}
            />
            {errors.identifier && <p className="mt-1 text-sm text-red-500">{errors.identifier}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              key={passwordUnlocked ? 'login-pw-unlocked' : 'login-pw-locked'}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={passwordUnlocked ? 'current-password' : 'off'}
              readOnly={!passwordUnlocked}
              onFocus={() => setPasswordUnlocked(true)}
              className={`block w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900 pr-10`}
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isPending || isGooglePending}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isPending || isGooglePending}
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
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="text-sm hover:underline bg-transparent border-none p-0"
              style={{ color: accent }}
              onClick={onForgotPassword}
              disabled={isPending || isGooglePending}
            >
              Forgot password?
            </button>
          </div>
          {showCaptcha && (
            <CaptchaField
              accent={accent}
              recaptchaKey={captchaRenderKey}
              action="login"
              onChange={(value) => {
                setCaptchaData(value || { captchaToken: '' });
                if (errors.captcha) {
                  setErrors(prev => ({ ...prev, captcha: '' }));
                }
              }}
              error={errors.captcha}
              disabled={isPending || isGooglePending}
            />
          )}
          {errors.submit && <p className="mt-1 text-sm text-red-500">{errors.submit}</p>}
          <button
            type="submit"
            disabled={isPending || isGooglePending}
            className={`w-full py-3 rounded-full text-white font-semibold text-lg shadow-md transition-colors ${isPending || isGooglePending ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: accent }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        {onSwitchToRegister && (
          <p className={`${showCredentialFormMobile ? 'block' : 'hidden md:block'} text-center text-sm text-gray-600 mt-5`}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: accent }}
              onClick={onSwitchToRegister}
              disabled={isPending || isGooglePending}
            >
              Sign Up
            </button>
          </p>
        )}
        <div className={`${showCredentialFormMobile ? 'flex md:hidden' : 'hidden'} justify-center gap-4 mt-4 mb-4`}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrors(prev => ({ ...prev, submit: 'Google sign-in failed. Please try again.' }))}
            text="signin_with"
            shape="pill"
          />
        </div>
      </div>
    </>
  );
};

export default Login; 