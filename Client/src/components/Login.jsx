import { useState, useLayoutEffect } from 'react';
import { z } from 'zod';
import { loginSchema, validateField } from '../validations/loginValidation';
import { useTenant } from '../context/TenantContext';
import { useLogin, getRememberedIdentifier } from '../hooks/userHooks/useLogin';
import AuthFieldLabel from './auth/AuthFieldLabel';
import AuthGoogleButton from './auth/AuthGoogleButton';

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
 * Login - Sign-in form with tenant-themed colours and reference layout.
 */
const Login = ({
  onClose,
  onForgotPassword,
  onSwitchToRegister,
  accent: accentProp,
  headingColor: headingColorProp,
  formPanelBg: formPanelBgProp,
}) => {
  const tenant = useTenant();
  const { mutate: loginMutation, isPending } = useLogin();
  const accent = accentProp || '#FE8C00';
  const headingColor = headingColorProp || '#1F2937';
  const formPanelBg = formPanelBgProp || '#F5F0E8';

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordUnlocked, setPasswordUnlocked] = useState(true);

  useLayoutEffect(() => {
    const saved = tenant?.companyPath
      ? getRememberedIdentifier(tenant.companyPath)
      : getRememberedIdentifier('');
    if (!saved) return;
    setPasswordUnlocked(false);
    setFormData((prev) => ({ ...prev, identifier: saved, password: '' }));
  }, [tenant?.companyPath]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(loginSchema, name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      loginSchema.parse(formData);
      loginMutation(
        { ...formData, remember: true, companyPath: tenant?.companyPath },
        {
          onSuccess: () => onClose(),
          onError: (error) => {
            const errorMessage = error.response?.data?.message;
            if (errorMessage?.toLowerCase().includes('invalid')) {
              setErrors((prev) => ({ ...prev, password: 'Invalid credentials please try again' }));
            } else if (errorMessage?.toLowerCase().includes('not active')) {
              setErrors((prev) => ({ ...prev, identifier: 'Your account is not active yet' }));
            } else {
              setErrors((prev) => ({ ...prev, submit: errorMessage || 'Login failed' }));
            }
          },
        },
      );
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
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{ backgroundColor: formPanelBg, ['--auth-accent']: accent }}
    >
      <AuthGoogleButton mode="login" onSuccess={onClose} companyPath={tenant?.companyPath} />

      <form className="space-y-3 mt-3" onSubmit={handleSubmit}>
        <div>
          <AuthFieldLabel htmlFor="identifier" required headingColor={headingColor}>
            Email or Phone Number
          </AuthFieldLabel>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            className={inputClass('identifier')}
            placeholder="Enter your email or phone number"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isPending}
          />
          {errors.identifier && <p className="mt-1 text-sm text-red-500">{errors.identifier}</p>}
        </div>

        <div className="relative">
          <AuthFieldLabel htmlFor="password" required headingColor={headingColor}>
            Password
          </AuthFieldLabel>
          <div className="relative">
            <input
              key={passwordUnlocked ? 'login-pw-unlocked' : 'login-pw-locked'}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={passwordUnlocked ? 'current-password' : 'off'}
              readOnly={!passwordUnlocked}
              onFocus={() => setPasswordUnlocked(true)}
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
          {errors.password && (
            <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errors.password}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm font-medium hover:underline bg-transparent border-none p-0"
            style={{ color: accent }}
            onClick={onForgotPassword}
            disabled={isPending}
          >
            Forgot password?
          </button>
        </div>

        {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

        <button
          type="submit"
          disabled={isPending}
          className={`w-full py-3 rounded-full text-white font-semibold text-base shadow-md transition-opacity ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          style={{ backgroundColor: accent }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          className="font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
          style={{ color: accent }}
          onClick={onSwitchToRegister}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
