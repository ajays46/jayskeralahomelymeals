import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSmartphone } from 'react-icons/fi';
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
    image: '/food-package.png',
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
          navigate(`${basePath}/order-address`, { replace: true });
        },
        onError: (error) => {
          const message = error?.response?.data?.message || 'Unable to update account details.';
          showValidationError(message);
        },
      }
    );
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f6f1e7] flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(246,241,231,0.85) 35%, rgba(246,241,231,1) 100%)',
        }}
      />
      <svg
        className="pointer-events-none absolute left-0 top-0 h-24 w-full sm:h-32"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#1f6f5f"
          fillOpacity="0.18"
          d="M0,128L48,133.3C96,139,192,149,288,160C384,171,480,181,576,170.7C672,160,768,128,864,128C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        />
        <path
          fill="#fe8c00"
          fillOpacity="0.14"
          d="M0,192L60,186.7C120,181,240,171,360,176C480,181,600,203,720,208C840,213,960,203,1080,181.3C1200,160,1320,128,1380,112L1440,96L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
        />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-24 w-full sm:h-32"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#1f6f5f"
          fillOpacity="0.12"
          d="M0,224L40,224C80,224,160,224,240,202.7C320,181,400,139,480,117.3C560,96,640,96,720,122.7C800,149,880,203,960,202.7C1040,203,1120,149,1200,117.3C1280,85,1360,75,1400,69.3L1440,64L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
        />
      </svg>
      <Navbar minimalNav />
      <main
        className={`relative z-10 pt-16 sm:pt-[72px] ${!showPhoneGate && !isSetupComplete ? 'pb-4' : 'pb-2'}`}
      >

        {/* ── PLAN SELECTION ── */}
        <section className="relative w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(31,78,69,0.08) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <p className="text-center text-sm font-bold uppercase tracking-[0.12em] text-[#2c5d54]">
                {pageCopy.sectionTitle}
              </p>
              <div className="mx-auto mt-2 max-w-md">
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
                    <div className="relative flex h-56 w-full items-center justify-center bg-[#f7f4ee] sm:h-64">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-h-full w-auto scale-110 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
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
                        className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]"
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
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-[#5f5f57]">
                  <FiSmartphone className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Enter Mobile Number"
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
                  style={{ backgroundColor: '#1f6f5f' }}
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
