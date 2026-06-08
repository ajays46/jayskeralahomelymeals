import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { useGoogleAuth } from '../../hooks/userHooks/useGoogleAuth';

const COPY = {
  login: {
    label: 'Sign in with Google',
    ariaLabel: 'Sign in with Google',
  },
  register: {
    label: 'Sign up with Google',
    ariaLabel: 'Sign up with Google',
  },
};

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/**
 * Compact pill Google auth button — logo + single line of text.
 */
const AuthGoogleButton = ({ mode = 'login', onSuccess, companyPath }) => {
  const copy = COPY[mode] ?? COPY.login;
  const { mutate, isPending } = useGoogleAuth();
  const isConfigured = Boolean(googleClientId);

  const startGoogleAuth = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (!tokenResponse?.access_token) {
        toast.error('Google sign-in failed. Please try again.');
        return;
      }

      mutate(
        {
          accessToken: tokenResponse.access_token,
          mode,
          companyPath,
          remember: true,
        },
        { onSuccess: () => onSuccess?.() },
      );
    },
    onError: () => toast.error('Google sign-in failed. Please try again.'),
  });

  const handleClick = () => {
    if (!isConfigured) {
      toast.error('Google sign-in is not configured.');
      return;
    }
    startGoogleAuth();
  };

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isConfigured || isPending}
        className="inline-flex items-center justify-center gap-2.5 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-normal text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={copy.ariaLabel}
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt=""
          className="h-[18px] w-[18px] shrink-0"
        />
        <span>{isPending ? 'Connecting...' : copy.label}</span>
      </button>
    </div>
  );
};

export default AuthGoogleButton;
