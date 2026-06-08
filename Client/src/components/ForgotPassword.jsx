import { useState } from 'react';
import { validateForgotIdentifier } from '../validations/forgotValidation';
import { useForgotPassword } from '../hooks/userHooks/useLogin';
import AuthFieldLabel from './auth/AuthFieldLabel';

/**
 * ForgotPassword - Password reset request form inside the auth modal.
 */
const ForgotPassword = ({
  onBackToLogin,
  accent: accentProp,
  headingColor: headingColorProp,
  formPanelBg: formPanelBgProp,
}) => {
  const accent = accentProp || '#FE8C00';
  const headingColor = headingColorProp || '#1F2937';
  const formPanelBg = formPanelBgProp || '#F5F0E8';

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { mutate: forgotPassword, isLoading } = useForgotPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForgotIdentifier(identifier);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    forgotPassword(identifier, {
      onSuccess: () => setSuccess(true),
      onError: (err) => {
        setError(err?.response?.data?.message || 'Failed to send reset link.');
      },
    });
  };

  return (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{ backgroundColor: formPanelBg, ['--auth-accent']: accent }}
    >
      <p className="text-gray-500 mb-5 text-sm text-center">
        Enter your email or phone number to reset your password.
      </p>

      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center text-sm">
          If an account exists, a password reset link has been sent.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <AuthFieldLabel htmlFor="forgot-identifier" required headingColor={headingColor}>
              Email or Phone Number
            </AuthFieldLabel>
            <input
              id="forgot-identifier"
              name="identifier"
              type="text"
              className={`block w-full rounded-xl border bg-white ${error ? 'border-red-500' : 'border-gray-200'} px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--auth-accent)] text-gray-900`}
              placeholder="Enter your email or phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-full text-white font-semibold text-base shadow-md transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{ backgroundColor: accent }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-5 text-center">
        <button
          type="button"
          className="hover:underline text-sm font-semibold bg-transparent border-none p-0 cursor-pointer"
          style={{ color: accent }}
          onClick={onBackToLogin}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
