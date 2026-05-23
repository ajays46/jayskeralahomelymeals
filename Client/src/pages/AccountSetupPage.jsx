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
    title: '🥗 OUR SIGNATURE SERVICE',
    description: 'Clean, Authentic Nadan food designed to keep you sharp and active all day.',
    cta: 'Try Today\'s Clean Picks',
    image: '/oonu.jpg',
  },
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
  const isPhoneValid = MOBILE_PATTERN.test(String(form.phone || '').replace(/\D/g, ''));
  const canSubmitProfile = isPhoneValid && form.termsAccepted && !isPending;

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
      <main
        className={`pt-16 sm:pt-[72px] sm:pb-10 ${!showPhoneGate && !isSetupComplete ? 'pb-16' : 'pb-8'}`}
      >

        {/* ── PLAN SELECTION ── */}
        <section className="relative w-full overflow-hidden border-y border-[#275447] bg-gradient-to-r from-[#12392f] via-[#154338] to-[#11352d] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <p className="text-center text-base font-bold uppercase tracking-[0.12em] text-[#8fbfb2]">
                Step Into the Healthy Hub
              </p>
              <div className="mx-auto mt-2 max-w-xl">
                {lunchHighlights.map((item) => (
                  <article
                    key={item.title}
                    onClick={handleReserveClick}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleReserveClick();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.18)] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f]/30"
                  >
                    <div className="relative h-48 w-full sm:h-52">
                      <img
                        src={item.image}
                        alt={item.planName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d2b22]/55 via-transparent to-transparent" />
                    </div>

                    <div className="p-6 sm:p-7">
                      <h3 className="text-2xl font-black text-[#183f38]">{item.title}</h3>
                      <p className="mt-4 text-base leading-relaxed text-[#3f4a46]">
                        {item.description}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleReserveClick(); }}
                        className="mt-5 w-full rounded-full px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]"
                        style={{ backgroundColor: '#1f6f5f' }}
                      >
                        {item.cta}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

            </div>
          </div>
        </section>

        <section className="w-full border-b border-[#ddd8cc] bg-[#f4f3ed] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: '📋', title: 'Flexible Choices' },
                { icon: '🛵', title: 'Direct Delivery' },
                { icon: '🌿', title: 'Healthy Ingredients' },
                { icon: '♻️', title: 'Plastic-Free Packaging' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-[#e2dccf] bg-white p-3 text-[#244f46] shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
                >
                  <p className="text-lg">{f.icon}</p>
                  <p className="mt-1 text-base font-semibold">{f.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showPhoneGate ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9cfbf] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <h3 className="mt-2 text-xl font-black text-[#183f38]">Almost there!</h3>
            <p className="mt-2 text-base text-[#5f5f57]">
              Enter your mobile number to see today's fresh delivery slots and view the menu.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-base font-semibold text-[#244f46]">Mobile Number:</label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-base font-semibold text-gray-700">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Enter Phone Number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  required
                />
              </div>

              <label className="flex items-start gap-2 text-base text-gray-700">
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
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitProfile}
                  className="flex-1 rounded-xl px-4 py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="text-base font-semibold text-[#244f46]">📱 Ready to experience clean energy?</p>
            <button
              type="button"
              onClick={() => setShowPhoneGate(true)}
              className="rounded-full bg-[#1f6f5f] px-4 py-2.5 text-base font-bold text-white"
            >
              🔒 Verify Mobile to Unlock Menus
            </button>
          </div>
        </div>
      ) : null}
      {showComingSoon ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#d9cfbf] bg-white p-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f6b60]">Reserve</p>
            <h3 className="mt-2 text-xl font-black text-[#183f38]">Coming Soon</h3>
            <p className="mt-2 text-base text-[#5f5f57]">
              Batch reservation will be enabled shortly. Stay tuned.
            </p>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="mt-5 rounded-xl px-4 py-2.5 text-base font-semibold text-white"
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
