import { useState } from 'react';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
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

/**
 * Register - User registration form component with validation
 * Handles new user registration with email, phone, and password validation
 * Sends companyPath so phone is unique per company (same phone allowed in different companies).
 * @param {() => void} [onSwitchToLogin] - When set (e.g. AuthSlider), shows “Login” link to open login tab.
 */
const Register = ({ accent: accentProp, onClose, onSwitchToLogin }) => {
  const tenant = useTenant();
  const accent = accentProp || '#FE8C00';
  const [formData, setFormData] = useState({
    email: '',
    phone: '+91',
    password: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [captchaData, setCaptchaData] = useState({ captchaId: '', captchaText: '' });
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [phoneCountry, setPhoneCountry] = useState('in');

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
      if (!captchaData.captchaId || !captchaData.captchaText) {
        setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
        return;
      }

      const normalizedPhone = String(formData.phone || '').trim();
      const normalizedEmail = String(formData.email || '').trim();

      // Add default name and companyPath for per-company phone uniqueness
      const registrationData = {
        email: normalizedEmail,
        phone: normalizedPhone,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
        name: normalizedEmail ? normalizedEmail.split('@')[0] : normalizedPhone.replace('+', ''),
        companyPath: tenant?.companyPath,
        captchaId: captchaData.captchaId,
        captchaText: captchaData.captchaText
      };

      // If validation passes, proceed with registration
      register(registrationData, {
        onSuccess: () => {
          // Show success message and switch to login form
          setFormData({
            email: '',
            phone: '+91',
            password: '',
            termsAccepted: false,
          });
          setCaptchaData({ captchaId: '', captchaText: '' });
          setCaptchaRenderKey(prev => prev + 1);
          setPhoneCountry('in');
          setErrors({});
          // Emit an event to switch to login form
          const switchToLoginEvent = new CustomEvent('switchToLogin', {
            detail: { message: 'Registration successful! Please sign in.' }
          });
          window.dispatchEvent(switchToLoginEvent);
        },
        onError: (error) => {
          const message = error.response?.data?.message || error.response?.data?.error?.message || '';

          if (message.includes('Email already registered')) {
            setErrors({ email: 'This email is already registered. Please sign in instead.' });
          } else if (message.includes('phone number is already registered')) {
            setErrors({ phone: 'This phone number is already registered. Please sign in instead.' });
          } else if (message.includes('Phone number is required')) {
            setErrors({ phone: message });
          } else if (message.toLowerCase().includes('captcha')) {
            setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
            setCaptchaData({ captchaId: '', captchaText: '' });
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
      <h3 className="md:hidden text-2xl font-bold text-gray-900 text-center mb-3">Create an account</h3>
      <h2 className="hidden md:block text-3xl font-bold text-gray-900 mb-4 text-center">Create an Account</h2>
      <div className="w-full max-w-md mx-auto p-6 pt-0 lg:pt-6 md:bg-white md:rounded-xl md:shadow-md" style={{ ['--auth-accent']: accent }}>
        <div className="hidden md:flex justify-center gap-4 mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrors(prev => ({ ...prev, submit: 'Google signup failed. Please try again.' }))}
            text="signup_with"
            shape="pill"
          />
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                country={phoneCountry}
                disableDropdown={false}
                countryCodeEditable={false}
                value={formData.phone.replace('+', '')}
                onChange={(value, countryData) => {
                  const dialCode = countryData?.dialCode ? `+${countryData.dialCode}` : '';
                  const phoneValue = value ? `+${value}` : dialCode;
                  setFormData((prevState) => ({
                    ...prevState,
                    phone: phoneValue
                  }));
                  if (countryData?.countryCode) {
                    setPhoneCountry(countryData.countryCode);
                  }
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                onBlur={() => {
                  const error = validateField(registerSchema, 'phone', formData.phone);
                  setErrors((prev) => ({ ...prev, phone: error }));
                }}
                disabled={isPending || isGooglePending}
                inputProps={{
                  id: 'phone',
                  name: 'phone',
                  autoComplete: 'tel'
                }}
                containerClass="!w-full"
                inputClass={`!w-full !h-[42px] !rounded-lg !pl-12 !text-gray-900 ${errors.phone ? '!border-red-500' : '!border-gray-300'}`}
                buttonClass={`${errors.phone ? '!border-red-500' : '!border-gray-300'} !rounded-l-lg`}
                searchClass="!w-full"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {errors.phone}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`block w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isPending || isGooglePending}
              />
              {errors.email && (
                <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {errors.email}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`block w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900 pr-10`}
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
          <CaptchaField
            accent={accent}
            recaptchaKey={captchaRenderKey}
            action="register"
            onChange={(value) => {
              setCaptchaData(value || { captchaId: '', captchaText: '' });
              if (errors.captcha) {
                setErrors(prev => ({ ...prev, captcha: '' }));
              }
            }}
            error={errors.captcha}
            disabled={isPending || isGooglePending}
          />
          <div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                className={`mt-1 h-4 w-4 rounded border ${errors.termsAccepted ? 'border-red-500' : 'border-gray-300'}`}
                checked={formData.termsAccepted}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isPending || isGooglePending}
              />
              <span>
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
            className={`w-full py-3 rounded-full text-white font-semibold text-lg shadow-md transition-colors ${isPending || isGooglePending ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: accent }}
          >
            {isPending || isGooglePending ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        {onSwitchToLogin && (
          <p className="text-center text-sm text-gray-600 mt-5">
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