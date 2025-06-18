import { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateForgotIdentifier } from '../validations/forgotValidation';
import { useForgotPassword } from '../hooks/userHooks/useLogin';

const ForgotPassword = ({ onBackToLogin }) => {
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
      onSuccess: () => {
        setSuccess(true);
      },
      onError: (err) => {
        setError(err?.response?.data?.message || 'Failed to send reset link.');
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 md:bg-white md:rounded-xl md:shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Forgot Password?</h2>
      <p className="text-gray-500 mb-6 text-sm text-center">Enter your email or phone number to reset your password.</p>
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
          If an account exists, a password reset link has been sent.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">Email or Phone Number</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              className={`block w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900`}
              placeholder="Enter your email or phone number"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg shadow-md transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-orange-500 hover:underline text-sm font-medium"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword; 