import React, { useEffect, useMemo, useState } from 'react';
import { showSuccessToast, showValidationError } from '../../utils/toastConfig';

const MODAL_CONTENT = {
  freeDelivery: {
    title: "JAY'S KERALA KITCHEN",
    subtitle: 'FOOD DELIVERY SERVICE',
    highlight: 'HUNGRY? 🔥',
    message:
      'Get Free Delivery On Your First Order! Join our VIP list to claim your free delivery code, plus receive our weekly rotating Veg & Non-Veg menus every Sunday night.',
    namePlaceholder: 'Enter your Name...',
    mobilePlaceholder: 'Enter Mobile Number (for WhatsApp/SMS codes)',
    consentLabel: 'Send my discount code and weekly menus via WhatsApp',
    requiresName: true,
    requiresConsent: true,
    cta: 'CLAIM MY FREE DELIVERY',
    ctaClass:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)]',
    finePrint: 'No spam. Just hot, home-cooked Kerala food.',
  },
  biryaniAlert: {
    title: "JAY'S KERALA KITCHEN",
    subtitle: 'FOOD DELIVERY SERVICE',
    highlight: '🍛 NEVER MISS BIRYANI WEDNESDAY! 🍛',
    message:
      "Our delicious Chicken & Veg Biryanis sell out fast every Wednesday! Don't miss out on your favorite mid-week treat. Sign up to get next week's menu sent straight to your phone via WhatsApp every Sunday evening before anyone else.",
    mobilePlaceholder: 'Enter Mobile Number...',
    consentLabel: 'Remind me on WhatsApp before Biryani sells out!',
    requiresConsent: true,
    cta: 'SEND ME WHATSAPP ALERTS',
    ctaClass:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)]',
    finePrint: '*Note: We deliver fresh daily. Consume food within 2 hours of delivery.',
  },
  weeklyDeals: {
    title: "JAY'S KERALA KITCHEN",
    subtitle: 'Weekly Menu Subscription',
    highlight: 'What are you craving?',
    message: 'Get tailored weekly deals sent to your phone!',
    mobilePlaceholder: 'Enter Mobile Number...',
    consentLabel: 'I agree to receive weekly menu updates on WhatsApp/SMS',
    requiresConsent: true,
    cta: 'SUBSCRIBE TO DEALS',
    ctaClass:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_8px_20px_rgba(0,0,0,0.25)]',
    showPreference: true,
  },
};

const MOBILE_PATTERN = /^\d{10}$/;

const HomeLeadCaptureModal = ({ isOpen, onClose, variant = 'freeDelivery', onSubmit }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [preference, setPreference] = useState('vegetarian');
  const [consent, setConsent] = useState(true);
  const content = useMemo(() => MODAL_CONTENT[variant] || MODAL_CONTENT.freeDelivery, [variant]);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setMobile('');
    setPreference('vegetarian');
    setConsent(true);
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedMobile = mobile.replace(/\D/g, '');
    if (content.requiresName && !name.trim()) {
      showValidationError('Please enter your name.');
      return;
    }
    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      showValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (content.requiresConsent && !consent) {
      showValidationError('Please check the WhatsApp/SMS consent option to continue.');
      return;
    }

    const payload = {
      variant,
      name: name.trim(),
      mobile: `+91${normalizedMobile}`,
      preference: content.showPreference ? preference : null,
      consent,
    };

    if (typeof onSubmit === 'function') onSubmit(payload);
    showSuccessToast('You are subscribed. We will keep you updated on WhatsApp/SMS.', 'Thank you!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="relative px-6 pt-6">
          <button
            type="button"
            aria-label="Close popup"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            ✕
          </button>

          <div className="text-center pr-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{content.title}</h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold tracking-wider text-gray-500 uppercase">
              {content.subtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-center text-lg sm:text-2xl font-bold text-gray-900">{content.highlight}</p>
          <p className="mt-4 text-center text-sm sm:text-base leading-relaxed text-gray-700">{content.message}</p>

          {content.requiresName ? (
            <div className="mt-6">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={content.namePlaceholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder={content.mobilePlaceholder}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          {content.showPreference ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-700">Choose your preference:</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="dietPreference"
                    value="vegetarian"
                    checked={preference === 'vegetarian'}
                    onChange={() => setPreference('vegetarian')}
                  />
                  <span>🟢 Vegetarian Only</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="dietPreference"
                    value="mixed"
                    checked={preference === 'mixed'}
                    onChange={() => setPreference('mixed')}
                  />
                  <span>🔴 Non-Vegetarian / Mix</span>
                </label>
              </div>
            </div>
          ) : null}

          {content.requiresConsent ? (
            <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1"
              />
              <span>{content.consentLabel}</span>
            </label>
          ) : null}

          <button
            type="submit"
            className={`mt-6 w-full rounded-xl px-4 py-3 text-sm sm:text-base font-bold transition ${content.ctaClass}`}
          >
            {content.cta}
          </button>

          {content.finePrint ? (
            <p className="mt-4 text-center text-xs sm:text-sm text-gray-500">{content.finePrint}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default HomeLeadCaptureModal;
