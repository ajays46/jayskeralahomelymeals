import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import {
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
  isStrongPassword,
  registerSchema,
  validateField
} from '../validations/registerValidation';
import { useTenant } from '../context/TenantContext';
import { useRegister } from '../hooks/userHooks/useRegister';
import { useGoogleAuth } from '../hooks/userHooks/useGoogleAuth';
import Terms from './Terms';
import CaptchaField from './CaptchaField';
import { executeRecaptchaV3 } from '../utils/recaptchaV3';

/**
 * Register - User registration form component with validation
 * Handles new user registration with email, phone, and password validation
 * Sends companyPath so phone is unique per company (same phone allowed in different companies).
 * @param {() => void} [onSwitchToLogin] - When set (e.g. AuthSlider), shows “Login” link to open login tab.
 */
const Register = ({ accent: accentProp, onClose, onSwitchToLogin }) => {
  const tenant = useTenant();
  const accent = accentProp || '#FE8C00';
  const inputClass =
    'block w-full rounded-xl border border-[#d3c8b8] bg-white px-3.5 py-2.5 text-[#223b36] shadow-sm transition-all duration-200 placeholder:text-[#8a877f] focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)]/55 focus:border-[color:var(--auth-accent)]';
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [emailIdentifier, setEmailIdentifier] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaData, setCaptchaData] = useState({ captchaToken: '' });
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [showGoogleConsentInline, setShowGoogleConsentInline] = useState(false);
  const [showGoogleConsentStatic, setShowGoogleConsentStatic] = useState(false);
  const [hasShownGoogleConsentNotice, setHasShownGoogleConsentNotice] = useState(false);
  const [isGoogleConsentReady, setIsGoogleConsentReady] = useState(false);
  const googleConsentTimerRef = useRef(null);

  const { mutate: register, isPending } = useRegister();
  const { mutate: googleAuthMutation, isPending: isGooglePending } = useGoogleAuth();
  const passwordValue = formData.password || '';
  const hasPasswordInput = passwordValue.length > 0;
  const passwordIsStrong = isStrongPassword(passwordValue);
  const passwordChecks = getPasswordChecks(passwordValue);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLevel = Math.min(5, Math.max(1, Math.ceil((passwordScore / 6) * 5)));
  const strengthLabelMap = {
    1: 'Very Weak',
    2: 'Weak',
    3: 'Fair',
    4: 'Good',
    5: 'Strong'
  };
  const strengthToneMap = {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-yellow-600',
    4: 'text-lime-600',
    5: 'text-green-600'
  };
  const strengthSegmentColorMap = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-lime-500',
    5: 'bg-green-500'
  };
  const strengthLabel = hasPasswordInput ? strengthLabelMap[strengthLevel] : '';
  const strengthTone = hasPasswordInput ? strengthToneMap[strengthLevel] : 'text-gray-500';
  const activeSegmentClass = hasPasswordInput ? strengthSegmentColorMap[strengthLevel] : 'bg-gray-200';

  useEffect(() => () => {
    if (googleConsentTimerRef.current) {
      clearTimeout(googleConsentTimerRef.current);
    }
  }, []);

  const triggerGoogleConsentNotice = () => {
    if (hasShownGoogleConsentNotice) return;

    setHasShownGoogleConsentNotice(true);
    setShowGoogleConsentInline(true);
    setShowGoogleConsentStatic(false);
    if (googleConsentTimerRef.current) {
      clearTimeout(googleConsentTimerRef.current);
    }
    googleConsentTimerRef.current = setTimeout(() => {
      setShowGoogleConsentInline(false);
      setShowGoogleConsentStatic(true);
      setIsGoogleConsentReady(true);
    }, 1000);
  };

  const handleGoogleClickCapture = (event) => {
    if (isGoogleConsentReady) return;
    event.preventDefault();
    event.stopPropagation();
    triggerGoogleConsentNotice();
  };

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

  const setIdentifierValue = (value) => {
    setFormData(prevState => ({
      ...prevState,
      identifier: value
    }));
    if (errors.identifier) {
      setErrors(prev => ({ ...prev, identifier: '' }));
    }
  };

  const handleEmailIdentifierChange = (e) => {
    const nextEmail = e.target.value;
    setEmailIdentifier(nextEmail);
    if (nextEmail.trim()) {
      setPhoneDigits('');
      setIdentifierValue(nextEmail);
      return;
    }
    setIdentifierValue(phoneDigits);
  };

  const handlePhoneDigitsChange = (e) => {
    const digitsOnly = String(e.target.value || '').replace(/\D/g, '');
    setPhoneDigits(digitsOnly);
    if (digitsOnly) {
      setEmailIdentifier('');
      setIdentifierValue(digitsOnly);
      return;
    }
    setIdentifierValue(emailIdentifier.trim());
  };

  const handleIdentifierBlur = () => {
    const error = validateField(registerSchema, 'identifier', formData.identifier);
    setErrors(prev => ({ ...prev, identifier: error }));
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
      const captchaPayload = {
        captchaToken: '',
        captchaProvider: 'v3',
        captchaAction: 'register'
      };
      if (showCaptcha) {
        if (!captchaData.captchaToken) {
          setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
          return;
        }
        captchaPayload.captchaToken = captchaData.captchaToken;
        captchaPayload.captchaProvider = 'v2';
      } else {
        const v3Token = await executeRecaptchaV3('register').catch(() => '');
        if (v3Token) {
          captchaPayload.captchaToken = v3Token;
        }
      }

      const normalizedIdentifier = String(formData.identifier || '').trim();
      const isEmailIdentifier = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
      const normalizedPhone = isEmailIdentifier
        ? ''
        : (() => {
            const compact = normalizedIdentifier.replace(/[\s-]/g, '');
            if (!compact) return '';
            return compact.startsWith('+') ? compact : `+${compact}`;
          })();
      const normalizedEmail = isEmailIdentifier ? normalizedIdentifier.toLowerCase() : '';

      // Add default name and companyPath for per-company phone uniqueness
      const registrationData = {
        identifier: normalizedIdentifier,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
        name: normalizedEmail ? normalizedEmail.split('@')[0] : normalizedPhone.replace('+', ''),
        companyPath: tenant?.companyPath,
        ...captchaPayload
      };

      // If validation passes, proceed with registration
      register(registrationData, {
        onSuccess: () => {
          // Show success message and switch to login form
          setFormData({
            identifier: '',
            password: '',
            termsAccepted: false,
          });
          setEmailIdentifier('');
          setPhoneDigits('');
          setShowCaptcha(false);
          setCaptchaData({ captchaToken: '' });
          setCaptchaRenderKey(prev => prev + 1);
          setErrors({});
          // Emit an event to switch to login form
          const switchToLoginEvent = new CustomEvent('switchToLogin', {
            detail: { message: 'Registration successful! Please sign in.' }
          });
          window.dispatchEvent(switchToLoginEvent);
        },
        onError: (error) => {
          const message = error.response?.data?.message || error.response?.data?.error?.message || '';
          const requireCaptcha = Boolean(error.response?.data?.details?.requireCaptcha);
          if (requireCaptcha) {
            setShowCaptcha(true);
            setCaptchaData({ captchaToken: '' });
            setCaptchaRenderKey(prev => prev + 1);
          }

          if (message.includes('Email already registered')) {
            setErrors({ identifier: 'This email is already registered. Please sign in instead.' });
          } else if (message.includes('phone number is already registered')) {
            setErrors({ identifier: 'This phone number is already registered. Please sign in instead.' });
          } else if (message.includes('Phone number is required')) {
            setErrors({ identifier: message });
          } else if (message.includes('Either email or phone number is required')) {
            setErrors({ identifier: message });
          } else if (message.toLowerCase().includes('captcha')) {
            setShowCaptcha(true);
            setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
            setCaptchaData({ captchaToken: '' });
            setCaptchaRenderKey(prev => prev + 1);
          } else if (error.response?.data?.errors) {
            setErrors(error.response.data.errors);
          } else if (message.toLowerCase().includes('password')) {
            setErrors({ password: message });
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

  const handleGoogleSuccess = (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setErrors(prev => ({ ...prev, submit: 'Google signup failed. Missing credential.' }));
      return;
    }

    googleAuthMutation(
      {
        credential,
        companyPath: tenant?.companyPath,
        remember: true
      },
      {
        onSuccess: () => onClose?.(),
        onError: (error) => {
          const errorMessage = error.response?.data?.message || 'Google signup failed';
          setErrors(prev => ({ ...prev, submit: errorMessage }));
        }
      }
    );
  };

  return (
    <>
      <h3 className="md:hidden mb-3 text-center text-2xl font-black tracking-tight text-gray-900">Create an account</h3>
      <h2 className="hidden md:block mb-4 text-center text-3xl font-black tracking-tight text-[#1f4e45]">Create an Account</h2>
      <div
        className="w-full max-w-md mx-auto rounded-3xl border border-[#d8cebe] bg-[#f7f2e8]/95 p-4 pt-0 lg:pt-4 md:p-5 md:pt-4 shadow-[0_18px_50px_rgba(31,78,69,0.14)]"
        style={{ ['--auth-accent']: accent }}
      >
        <div className="hidden md:flex justify-center gap-4 mb-4">
          <div
            onClickCapture={handleGoogleClickCapture}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setErrors(prev => ({ ...prev, submit: 'Google signup failed. Please try again.' }));
              }}
              text="signup_with"
              shape="pill"
            />
          </div>
        </div>
        <form className="space-y-3 mt-1" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <div>
              <label htmlFor="phoneIdentifier" className="block text-sm font-medium text-[#2b4f47] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div
              className={`flex w-full items-center rounded-xl border bg-white px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[color:var(--auth-accent)]/55 focus-within:border-[color:var(--auth-accent)] ${errors.identifier ? 'border-red-500 focus-within:ring-red-200 focus-within:border-red-500' : 'border-[#d3c8b8]'}`}
              >
                <input
                  id="phoneIdentifier"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full border-none bg-transparent p-0 text-[#223b36] focus:outline-none focus:ring-0 placeholder:text-[#8a877f]"
                  placeholder="Enter mobile number"
                  value={phoneDigits}
                  onChange={handlePhoneDigitsChange}
                  onBlur={handleIdentifierBlur}
                  disabled={isPending || isGooglePending}
                  autoComplete="tel"
                />
              </div>
              <p className="my-1 text-center text-xs font-medium text-[#6d746f]">OR</p>
              <label htmlFor="emailIdentifier" className="block text-sm font-medium text-[#2b4f47] mb-0.5">
                Email
              </label>
              <input
                id="emailIdentifier"
                type="email"
                className={`${inputClass} ${errors.identifier ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''}`}
                placeholder="name@example.com"
                value={emailIdentifier}
                onChange={handleEmailIdentifierChange}
                onBlur={handleIdentifierBlur}
                disabled={isPending || isGooglePending}
                autoComplete="email"
              />
              {errors.identifier && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errors.identifier}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-[#2b4f47] mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClass} ${errors.password ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''} pr-10`}
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
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
            {hasPasswordInput && !passwordIsStrong && (
              <>
                <p
                  className={`mt-1.5 text-[11px] font-medium ${strengthTone}`}
                  role="status"
                  aria-live="polite"
                >
                  Password strength: {strengthLabel}
                </p>
                <div className="mt-1 flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((segment) => (
                    <div
                      key={segment}
                      className={`h-1 flex-1 rounded-full ${segment <= strengthLevel ? activeSegmentClass : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Use at least {PASSWORD_MIN_LENGTH} characters.
                </p>
              </>
            )}
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>
          {showCaptcha && (
            <CaptchaField
              accent={accent}
              recaptchaKey={captchaRenderKey}
              action="register"
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
          <div>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-[#2b4f47] leading-tight">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                className={`h-4 w-4 shrink-0 rounded border ${errors.termsAccepted ? 'border-red-500' : 'border-gray-300'} text-[color:var(--auth-accent)] focus:ring-[color:var(--auth-accent)]`}
                checked={formData.termsAccepted}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isPending || isGooglePending}
              />
              <span className="inline-flex flex-wrap items-center gap-1">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="font-medium hover:underline"
                  style={{ color: accent, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Terms & Conditions
                </button>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>
            )}
          </div>
          {errors.submit && <p className="mt-1 text-sm text-red-500">{errors.submit}</p>}
          <button
            type="submit"
            disabled={isPending || isGooglePending}
            className={`w-full rounded-full py-2.5 text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] transition-all duration-200 ${isPending || isGooglePending ? 'cursor-not-allowed opacity-50' : 'hover:brightness-105 active:scale-[0.99]'}`}
            style={{ backgroundColor: accent }}
          >
            {isPending || isGooglePending ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        {onSwitchToLogin && (
          <p className="text-center text-sm text-[#5f6e69] mt-3">
            Already have an account?{' '}
            <button
              type="button"
              className="font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: accent }}
              onClick={onSwitchToLogin}
              disabled={isPending || isGooglePending}
            >
              Sign In
            </button>
          </p>
        )}
      </div>
      <Terms isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} compact />
    </>
  );
};

export default Register; 