import { useState } from 'react';
import Terms from './Terms';
import { z } from 'zod';
import { registerSchema, validateField } from '../validations/registerValidation';
import { useTenant } from '../context/TenantContext';
import { useRegister } from '../hooks/userHooks/useRegister';
import AuthFieldLabel from './auth/AuthFieldLabel';
import AuthGoogleButton from './auth/AuthGoogleButton';
import AuthOrDivider from './auth/AuthOrDivider';

const PasswordToggle = ({ show, onToggle, disabled }) => (
  <button
    type="button"
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={show ? 'Hide password' : 'Show password'}
    disabled={disabled}
  >
    {show ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.221-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
      </svg>
    )}
  </button>
);

/**
 * Register - Sign-up form with tenant-themed colours and reference layout.
 */
const Register = ({
  onSwitchToLogin,
  onClose,
  accent: accentProp,
  headingColor: headingColorProp,
  formPanelBg: formPanelBgProp,
}) => {
  const tenant = useTenant();
  const accent = accentProp || '#FE8C00';
  const headingColor = headingColorProp || '#1F2937';
  const formPanelBg = formPanelBgProp || '#F5F0E8';

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errors, setErrors] = useState({});

  const { mutate: register, isPending } = useRegister();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    const error = validateField(registerSchema, name, fieldValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      registerSchema.parse(formData);
      const registrationData = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
        name: formData.email.split('@')[0],
        companyPath: tenant?.companyPath,
      };

      register(registrationData, {
        onSuccess: () => {
          setFormData({ email: '', phone: '', password: '', termsAccepted: false });
          setErrors({});
          window.dispatchEvent(
            new CustomEvent('switchToLogin', {
              detail: { message: 'Registration successful! Please sign in.' },
            }),
          );
        },
        onError: (error) => {
          const message = error.response?.data?.message || '';
          if (message.includes('Terms & Conditions')) {
            setErrors({ termsAccepted: message });
          } else if (message.includes('Email already registered')) {
            setErrors({ email: 'This email is already registered. Please login instead.' });
          } else if (message.includes('phone number is already registered')) {
            setErrors({ phone: 'This phone number is already registered. Please login instead.' });
          } else if (error.response?.data?.errors) {
            setErrors(error.response.data.errors);
          } else {
            setErrors({ submit: 'Registration failed. Please try again.' });
          }
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => { newErrors[err.path[0]] = err.message; });
        setErrors(newErrors);
      }
    }
  };

  const inputClass = (field) =>
    `block w-full rounded-xl border bg-white ${errors[field] ? 'border-red-500' : 'border-gray-200'} px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900`;

  return (
    <>
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ backgroundColor: formPanelBg, ['--auth-accent']: accent }}
      >
        <AuthGoogleButton mode="register" onSuccess={onClose} companyPath={tenant?.companyPath} />

        <form className="space-y-3 mt-3" onSubmit={handleSubmit}>
          <div>
            <AuthFieldLabel htmlFor="phone" required headingColor={headingColor}>
              Phone Number
            </AuthFieldLabel>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={inputClass('phone')}
              placeholder="Enter mobile number"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isPending}
            />
            {errors.phone && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
                {errors.phone}
              </div>
            )}
          </div>

          <AuthOrDivider />

          <div>
            <AuthFieldLabel htmlFor="email" headingColor={headingColor}>
              Email
            </AuthFieldLabel>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClass('email')}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isPending}
            />
            {errors.email && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
                {errors.email}
              </div>
            )}
          </div>

          <div>
            <AuthFieldLabel htmlFor="password" required headingColor={headingColor}>
              Password
            </AuthFieldLabel>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass('password')} pr-10`}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isPending}
              />
              <PasswordToggle
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                disabled={isPending}
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-0.5 h-4 w-4 shrink-0 focus:ring-[color:var(--auth-accent)] border-gray-300 rounded ${errors.termsAccepted ? 'border-red-500' : ''}`}
                style={{ accentColor: accent }}
                disabled={isPending}
              />
              <span className="inline-flex flex-wrap items-center gap-1">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                  style={{ color: accent }}
                >
                  Terms & Conditions
                </button>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>
            )}
          </div>

          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 rounded-full text-white font-semibold text-base shadow-md transition-opacity ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{ backgroundColor: accent }}
          >
            {isPending ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
            style={{ color: accent }}
            onClick={onSwitchToLogin}
          >
            Sign In
          </button>
        </p>
      </div>

      <Terms isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} compact />
    </>
  );
};

export default Register;
