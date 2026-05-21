import React, { useState } from 'react';
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
    performance:
      'High-protein traditional curry, clean complex carbs, and fresh seasonal microgreens.',
    energy:
      'Cultivated with authentic Kerala roots and engineered specifically to defeat the afternoon slump.',
    image: '/oonu.jpg',
  },
  {
    title: 'The Clean Fuel Bowl',
    performance:
      'An ultra-low-oil, fiber-rich smart office meal featuring light preparations and rotating seasonal sides.',
    energy:
      'Designed for zero bloating and sustained mental focus during heavy afternoon corporate meetings.',
    image: '/rice.png',
  },
  {
    title: 'The Premium Wellness Plate',
    performance:
      'Fresh, organic farm-to-table soup and super salad pairings, packed strictly in non-plastic, eco-friendly paper packaging.',
    energy:
      'Tailored for health-conscious senior staff who refuse to compromise on clean, elite ingredients.',
    image: '/combo%20(2).png',
  },
];

const trustBadges = [
  '🌱 100% Microgreen Infused',
  '🚫 Zero Plastic (Packed in Eco-Friendly Premium Paper)',
  '⚡ Precise Workday Delivery Windows',
  '🍲 Chef-Crafted, Ultra-Low Oil',
];

const AccountSetupPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const { mutate: completeProfile, isPending } = useCompleteGoogleProfile();
  const initialPhoneDigits = String(user?.phone || '').replace(/\D/g, '');
  const initialSetupComplete = initialPhoneDigits.length >= 10 && user?.termsAccepted === true;

  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [showPhoneGate, setShowPhoneGate] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(initialSetupComplete);
  const [form, setForm] = useState({
    phone: initialPhoneDigits.slice(-10),
    termsAccepted: Boolean(user?.termsAccepted),
  });

  const handleReserveClick = () => {
    if (isSetupComplete) {
      setShowComingSoon(true);
      return;
    }
    setShowPhoneGate(true);
  };

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
          setIsSetupComplete(true);
          setShowPhoneGate(false);
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
      <main className="pt-16 sm:pt-[72px] pb-28 sm:pb-10">
        <section className="relative w-full overflow-hidden border-y border-[#275447] bg-gradient-to-r from-[#12392f] via-[#154338] to-[#11352d] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <h2 className="mt-2 text-3xl font-black leading-[1.05] text-[#f3f1de] sm:text-4xl">Exclusive Workday Batches</h2>
              <p className="mt-3 text-sm font-semibold text-[#d9e8de]">
                ✨ Welcome back! You have unlocked today&apos;s exclusive, chef-crafted midday fuel.
              </p>
              <div className="mt-4 overflow-x-auto scrollbar-hide">
                <div className="inline-flex min-w-full items-center gap-2 sm:flex sm:flex-wrap sm:justify-center">
                  {trustBadges.map((badge) => (
                    <span
                      key={badge}
                      className="whitespace-nowrap rounded-full border border-[#3a6a5d] bg-[#123a31]/80 px-3 py-1.5 text-[11px] font-semibold text-[#e6efe9] sm:text-xs"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lunchHighlights.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-2xl border border-[#ded5c7] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <div className="relative h-36 w-full">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d25]/60 via-[#1f5a4b]/20 to-transparent" />
                  </div>
                  <div className="p-4">
                  <h3 className="text-lg font-bold text-[#244f46]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#3f4a46]">
                    <span className="font-semibold text-[#234b43]">The Performance:</span> {item.performance}
                  </p>
                  <p className="mt-2 text-sm text-[#3f4a46]">
                    <span className="font-semibold text-[#234b43]">The Energy:</span> {item.energy}
                  </p>
                  <button
                    type="button"
                    onClick={handleReserveClick}
                    className="mt-3 rounded-full border border-[#d1c7b8] bg-[#f7f2e8] px-3.5 py-1.5 text-xs font-semibold text-[#234b43] transition hover:bg-[#eee8dd]"
                  >
                    {isSetupComplete ? 'Reserve Today\'s Batch' : '🔒 Reserve Today\'s Batch'}
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
      {!showPhoneGate && !isSetupComplete ? (
        <div className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 sm:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2 rounded-2xl border border-[#d8cebe] bg-[#fff9ed]/95 px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur">
            <p className="text-xs font-semibold text-[#244f46]">📱 Ready to experience clean energy?</p>
            <button
              type="button"
              onClick={() => setShowPhoneGate(true)}
              className="rounded-full bg-[#1f6f5f] px-3 py-1.5 text-[11px] font-bold text-white"
            >
              🔒 Verify Mobile to Unlock Menus
            </button>
          </div>
        </div>
      ) : null}
      {showComingSoon ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#d9cfbf] bg-white p-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6b60]">Reserve</p>
            <h3 className="mt-2 text-xl font-black text-[#183f38]">Coming Soon</h3>
            <p className="mt-2 text-sm text-[#5f5f57]">
              Batch reservation will be enabled shortly. Stay tuned.
            </p>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      <Terms isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </div>
  );
};

export default AccountSetupPage;
