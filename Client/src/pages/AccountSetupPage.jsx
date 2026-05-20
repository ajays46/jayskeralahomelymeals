import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Terms from '../components/Terms';
import { useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { useCompleteGoogleProfile } from '../hooks/userHooks/useCompleteGoogleProfile';
import useAuthStore from '../stores/Zustand.store';
import { showSuccessToast, showValidationError } from '../utils/toastConfig';

const MOBILE_PATTERN = /^\d{10}$/;

const lunchHighlights = [
  {
    title: 'The Power Combo',
    description:
      'High-protein traditional curry, clean complex carbs, and fresh seasonal microgreens. Engineered to fight the afternoon slump.',
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'The Clean Fuel Bowl',
    description:
      'An ultra-low-oil, fiber-rich corporate meal designed for zero bloating and sustained mental focus.',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'The Clean Slate Soup & Salad Combo',
    description:
      'Fresh, organic produce packed strictly in non-plastic, eco-friendly paper packaging.',
    image:
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80',
  },
];

const AccountSetupPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const { mutate: completeProfile, isPending } = useCompleteGoogleProfile();

  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [showPhoneGate, setShowPhoneGate] = useState(false);
  const [form, setForm] = useState({
    phone: String(user?.phone || '').replace(/\D/g, '').slice(-10),
    termsAccepted: Boolean(user?.termsAccepted),
  });

  const needsSetup = useMemo(() => {
    const phoneDigits = String(user?.phone || '').replace(/\D/g, '');
    return phoneDigits.length < 10 || user?.termsAccepted !== true;
  }, [user?.phone, user?.termsAccepted]);

  useEffect(() => {
    if (needsSetup) return;
    navigate(`${tenant?.companyPath ? `/${tenant.companyPath}` : ''}/menu`, { replace: true });
  }, [needsSetup, navigate, tenant?.companyPath]);

  if (!needsSetup) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const phoneDigits = String(form.phone || '').replace(/\D/g, '');
    if (!MOBILE_PATTERN.test(phoneDigits)) {
      showValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!form.termsAccepted) {
      showValidationError('Please accept Terms & Conditions to continue.');
      return;
    }

    completeProfile(
      { phone: phoneDigits, termsAccepted: true },
      {
        onSuccess: (response) => {
          if (!response?.success) return;
          showSuccessToast('Account activated successfully.', 'Done');
          setShowPhoneGate(false);
          navigate(`${tenant?.companyPath ? `/${tenant.companyPath}` : ''}/menu`, { replace: true });
        },
        onError: (error) => {
          const message = error?.response?.data?.message || 'Unable to update account details.';
          showValidationError(message);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f1e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar minimalNav />
      <main className="pt-16 sm:pt-[72px] pb-10">
        <section className="relative w-full overflow-hidden border-y border-[#275447] bg-gradient-to-r from-[#12392f] via-[#154338] to-[#11352d] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#cfe3d8]">The Menu</p>
              <h2 className="mt-2 text-4xl font-black leading-[1.05] text-[#f3f1de] sm:text-5xl">Build your bowl.</h2>
              <p className="mt-3 text-sm font-semibold text-[#d9e8de]">Exclusive Healthy Combos</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lunchHighlights.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-2xl border border-[#ded5c7] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <div className="relative h-36 w-full">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d25]/60 via-[#1f5a4b]/20 to-transparent" />
                  </div>
                  <div className="p-4">
                  <h3 className="text-lg font-bold text-[#244f46]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#3f4a46]">{item.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(item.title);
                      setShowPhoneGate(true);
                    }}
                    className="mt-3 rounded-full border border-[#d1c7b8] bg-[#f7f2e8] px-3.5 py-1.5 text-xs font-semibold text-[#234b43] transition hover:bg-[#eee8dd]"
                  >
                    🔒 Reserve Today&apos;s Batch
                  </button>
                  </div>
                </article>
              ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showPhoneGate ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9cfbf] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6b60]">Account Setup (Final Step)</p>
            <h3 className="mt-2 text-xl font-black text-[#183f38]">Almost there!</h3>
            <p className="mt-2 text-sm text-[#5f5f57]">
              Enter your mobile number to instantly verify your delivery zone and unlock active ordering.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-[#244f46]">Mobile Number:</label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Enter Phone Number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  required
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(event) => setForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))}
                  className="mt-1"
                  required
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-semibold underline"
                    style={{ color: accent }}
                    onClick={() => setTermsModalOpen(true)}
                  >
                    Terms & Conditions
                  </button>
                  .
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneGate(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {isPending ? 'Saving...' : 'Submit & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <Terms isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </div>
  );
};

export default AccountSetupPage;
