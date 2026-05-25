import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Terms from '../components/Terms';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { useCompleteGoogleProfile } from '../hooks/userHooks/useCompleteGoogleProfile';
import useAuthStore from '../stores/Zustand.store';
import { showSuccessToast, showValidationError } from '../utils/toastConfig';

const MOBILE_PATTERN = /^\d{10}$/;

const defaultHighlights = [
  {
    title: 'VEG LUNCH',
    description: '',
    cta: 'Go',
    image: '/hero/heroo.png',
  },
];

const jlgHighlights = [
  {
    title: 'OUR SIGNATURE GREENS',
    description: 'Fresh, clean microgreens grown to keep you healthy and active all day.',
    cta: "Get Today's Greens",
    image: '/JLG.png',
  },
];

const AccountSetupPage = ({ variant = 'default' }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const tenant = useTenant();
  const basePath = useCompanyBasePath();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const isJlgView = variant === 'jlg' || String(tenant?.companyPath || '').toLowerCase().trim() === 'jlg';
  const pageCopy = {
    sectionTitle: isJlgView ? 'Step Into Jay\'s Leafy Greens' : 'Step Into the Healthy Hub',
    highlightItems: isJlgView ? jlgHighlights : defaultHighlights,
    features: isJlgView
      ? [
          { icon: '🥬', title: 'Fresh Microgreens' },
          { icon: '🚚', title: 'Daily Delivery' },
          { icon: '🌱', title: 'Farm Fresh Quality' },
          { icon: '♻️', title: 'Eco Packaging' },
        ]
      : [],
  };
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
          navigate(`${basePath}/order`, { replace: true });
        },
        onError: (error) => {
          const message = error?.response?.data?.message || 'Unable to update account details.';
          showValidationError(message);
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[#f6f1e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar minimalNav />
      <main
        className={`pt-16 sm:pt-[72px] ${!showPhoneGate && !isSetupComplete ? 'pb-4' : 'pb-2'}`}
      >

        {/* ── PLAN SELECTION ── */}
        <section className="relative w-full overflow-hidden border-y border-[#275447] bg-gradient-to-r from-[#12392f] via-[#154338] to-[#11352d] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <p className="text-center text-sm font-bold uppercase tracking-[0.12em] text-[#8fbfb2]">
                {pageCopy.sectionTitle}
              </p>
              <div className="mx-auto mt-2 max-w-xl">
                {pageCopy.highlightItems.map((item) => (
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
                    <div className="relative h-36 w-full bg-[#0f2f27] sm:h-40">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d2b22]/55 via-transparent to-transparent" />
                    </div>

                    <div className="p-4 sm:p-5">
                      <h3 className="text-xl font-black text-[#183f38]">{item.title}</h3>
                      {item.description ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#3f4a46]">
                          {item.description}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleReserveClick(); }}
                        className="mt-3 w-full rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]"
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

        {pageCopy.features.length ? (
          <section className="w-full border-b border-[#ddd8cc] bg-[#f4f3ed] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pageCopy.features.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-[#e2dccf] bg-white p-3 text-[#244f46] shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
                  >
                    <p className="text-lg">{f.icon}</p>
                    <p className="mt-1 text-sm font-semibold">{f.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {showPhoneGate ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d9cfbf] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={() => setShowPhoneGate(false)}
              disabled={isPending}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-[#5f5f57] transition hover:bg-[#f4f3ed]"
            >
              ×
            </button>
            <h3 className="mt-2 text-xl font-black text-[#183f38]">Almost there!</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-[#244f46]">Mobile Number:</label>
              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Enter Mobile Number"
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

              <div className="flex">
                <button
                  type="submit"
                  disabled={!canSubmitProfile}
                  className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {isPending ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {showComingSoon ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#d9cfbf] bg-white p-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f6b60]">Reserve</p>
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
