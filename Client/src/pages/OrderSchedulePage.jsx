import React, { useEffect, useMemo, useState } from 'react';
import { MdCalendarMonth, MdEventRepeat } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';

const RECURRENCE_OPTIONS = [
  { id: 'daily', label: 'Daily', defaultCount: 7 },
  { id: 'weekly', label: 'Weekly', defaultCount: 4 },
  { id: 'monthly', label: 'Monthly', defaultCount: 3 },
];

const toDateInputValue = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (baseDate, days) => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
};

const addMonths = (baseDate, months) => {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + months);
  return date;
};

const generateScheduleDates = (startDate, recurrence, occurrences) => {
  if (!startDate || !occurrences) return [];
  const safeOccurrences = Math.max(1, Math.min(60, Number(occurrences) || 1));
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [];

  return Array.from({ length: safeOccurrences }, (_, index) => {
    if (recurrence === 'weekly') return addDays(base, index * 7);
    if (recurrence === 'monthly') return addMonths(base, index);
    return addDays(base, index);
  });
};

const OrderSchedulePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme?.accentColor || theme?.primaryColor || '#FE8C00';

  const selectedMenu = location.state?.selectedMenuFromOrder || null;
  const menuQuantity = Number(location.state?.menuQuantityFromOrder || 1);
  const selectedAddons = Array.isArray(location.state?.selectedAddonsFromOrder)
    ? location.state.selectedAddonsFromOrder
    : [];

  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const [recurrence, setRecurrence] = useState('daily');
  const [occurrences, setOccurrences] = useState(7);
  const [startDate, setStartDate] = useState(toDateInputValue(tomorrow));

  const scheduledDates = useMemo(
    () => generateScheduleDates(startDate, recurrence, occurrences),
    [startDate, recurrence, occurrences]
  );

  const menuTitle = selectedMenu?.product?.productName || selectedMenu?.name || 'Selected Meal';

  useEffect(() => {
    if (!selectedMenu) {
      navigate(`${basePath}/order`, { replace: true });
    }
  }, [selectedMenu, navigate, basePath]);

  const handleRecurrenceChange = (nextRecurrence) => {
    setRecurrence(nextRecurrence);
    const match = RECURRENCE_OPTIONS.find((item) => item.id === nextRecurrence);
    if (match) setOccurrences(match.defaultCount);
  };

  const handleContinue = () => {
    navigate(`${basePath}/place-order`, {
      state: {
        ...location.state,
        schedulePreference: {
          recurrence,
          startDate,
          occurrences: Math.max(1, Number(occurrences) || 1),
          selectedDates: scheduledDates.map(toDateInputValue),
        },
        selectedDatesFromSchedule: scheduledDates.map(toDateInputValue),
      },
    });
  };

  if (!selectedMenu) return null;

  return (
    <div className="min-h-screen bg-[#f6f1e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar minimalNav />
      <main className="pt-16 sm:pt-[72px] pb-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1f2e2a]">Schedule & Save Order</h1>
            <p className="mt-2 text-sm text-[#6f6c64]">Select recurrence and delivery dates before checkout</p>
          </div>

          <div className="rounded-2xl border border-[#ddd8cc] bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <MdEventRepeat className="text-xl" style={{ color: accent }} />
              <h2 className="text-lg font-bold text-[#1f2e2a]">Repeat Option</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {RECURRENCE_OPTIONS.map((option) => {
                const active = option.id === recurrence;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleRecurrenceChange(option.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active ? 'border-transparent text-white' : 'border-[#ddd8cc] text-[#4e4a42] hover:bg-[#f8f4ec]'
                    }`}
                    style={active ? { backgroundColor: accent } : undefined}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#2f3d39]">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  min={toDateInputValue(tomorrow)}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-xl border border-[#ddd8cc] px-3 py-2.5 text-sm outline-none focus:border-[#fd8f2d] focus:ring-2 focus:ring-[#fd8f2d]/15"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#2f3d39]">Number of Deliveries</span>
                <input
                  type="number"
                  value={occurrences}
                  min={1}
                  max={60}
                  onChange={(event) => setOccurrences(Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-xl border border-[#ddd8cc] px-3 py-2.5 text-sm outline-none focus:border-[#fd8f2d] focus:ring-2 focus:ring-[#fd8f2d]/15"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ddd8cc] bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <MdCalendarMonth className="text-xl" style={{ color: accent }} />
              <h2 className="text-lg font-bold text-[#1f2e2a]">Schedule Preview</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scheduledDates.slice(0, 10).map((date) => (
                <span
                  key={date.toISOString()}
                  className="rounded-full border border-[#e4dece] bg-[#fbf7ef] px-3 py-1 text-xs font-semibold text-[#4e4a42]"
                >
                  {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              ))}
              {scheduledDates.length > 10 ? (
                <span className="rounded-full border border-[#e4dece] bg-[#fbf7ef] px-3 py-1 text-xs font-semibold text-[#4e4a42]">
                  +{scheduledDates.length - 10} more
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[#ddd8cc] bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-[#1f2e2a]">{menuTitle} x{menuQuantity}</p>
            {selectedAddons.length > 0 ? (
              <p className="mt-1 text-xs text-[#6f6c64]">
                Add-ons: {selectedAddons.map((addon) => `${addon.name} x${addon.quantity || 1}`).join(', ')}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/order`)}
              className="rounded-xl border border-[#ddd8cc] px-4 py-3 text-sm font-semibold text-[#4e4a42] transition hover:bg-[#f8f4ec]"
            >
              Back to Order
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
              style={{ backgroundColor: accent }}
            >
              Continue to Place Order
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSchedulePage;
