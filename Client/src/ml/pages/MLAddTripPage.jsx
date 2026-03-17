/**
 * MLAddTripPage - MaXHub Logistics: Delivery partner adds trip(s).
 * Pickup location only; delivery address is added later on My Trips (delivery stop card). Multiple trips per session.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';
import { useAddMlTrips } from '../../hooks/mlHooks/useAddMlTrips';
import useMLDeliveryPartnerStore from '../../stores/MLDeliveryPartner.store.js';
import { MdLocationOn, MdDelete, MdMap } from 'react-icons/md';
import MapLocationPickerModal from '../components/MapLocationPickerModal';

function hasAddressData(loc) {
  return !!(loc && ((loc.googleMapsUrl || '').trim() || ((loc.street || '').trim() && (loc.city || '').trim() && (loc.pincode || '').toString().trim())));
}

const PLATFORMS = [
  { id: 'swiggy', label: 'Swiggy' },
  { id: 'uber', label: 'Uber' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
];

const initialLocation = {
  street: '',
  housename: '',
  city: '',
  pincode: '',
  geoLocation: '',
  googleMapsUrl: '',
};

function LocationBlock({
  title,
  idPrefix,
  location,
  onChange,
  showManual,
  onToggleManual,
  errors,
  clearError,
  accent,
  onOpenMapPicker,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {onOpenMapPicker && (
        <button
          type="button"
          onClick={onOpenMapPicker}
          className="w-full min-h-[44px] py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          style={{ borderColor: accent, color: accent }}
        >
          <MdMap className="w-5 h-5" />
          Pick location on map
        </button>
      )}
      <div>
        <label htmlFor={`${idPrefix}-maplink`} className="block text-sm font-medium text-gray-700 mb-1">
          Map link <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-maplink`}
          type="url"
          name="googleMapsUrl"
          value={location.googleMapsUrl}
          onChange={(e) => {
            onChange(e);
            if (errors.googleMapsUrl) clearError('googleMapsUrl');
          }}
          placeholder={`Paste Google Maps link for ${title.toLowerCase()}`}
          className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
            errors.googleMapsUrl ? 'border-red-400' : 'border-gray-200'
          } focus:border-gray-400 focus:ring-gray-100`}
          aria-invalid={!!errors.googleMapsUrl}
        />
        {errors.googleMapsUrl && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.googleMapsUrl}</p>
        )}
      </div>
      <div className="border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onToggleManual}
          className="text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-200 rounded-lg py-1.5 px-2 -ml-2"
          style={{ color: accent }}
        >
          {showManual ? 'Hide manual address' : 'Add address manually'}
          <span className="text-lg leading-none">{showManual ? ' −' : ' +'}</span>
        </button>
        {showManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="space-y-4 mt-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="street"
                value={location.street}
                onChange={onChange}
                placeholder="Street address"
                className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                  errors.street ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {errors.street && <p className="mt-1 text-sm text-red-600" role="alert">{errors.street}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House / Building name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="housename"
                value={location.housename}
                onChange={onChange}
                placeholder="House or building name"
                className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                  errors.housename ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {errors.housename && <p className="mt-1 text-sm text-red-600" role="alert">{errors.housename}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={location.city}
                  onChange={onChange}
                  placeholder="City"
                  className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                    errors.city ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.city && <p className="mt-1 text-sm text-red-600" role="alert">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="pincode"
                  value={location.pincode}
                  onChange={onChange}
                  placeholder="5–6 digits"
                  maxLength={6}
                  className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                    errors.pincode ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.pincode && <p className="mt-1 text-sm text-red-600" role="alert">{errors.pincode}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geo / Location <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                name="geoLocation"
                value={location.geoLocation}
                onChange={onChange}
                placeholder="Coordinates or location name"
                className="w-full min-h-[44px] py-3 px-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-offset-0 focus:border-gray-400 text-base"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const MLAddTripPage = () => {
  const base = useCompanyBasePath();
  const navigate = useNavigate();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';

  const storePlatform = useMLDeliveryPartnerStore((s) => s.platform);
  const platform = storePlatform || 'swiggy';
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label || 'Swiggy';

  const [price, setPrice] = useState('');
  const [partnerPayment, setPartnerPayment] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pickup, setPickup] = useState(initialLocation);
  const [showManualPickup, setShowManualPickup] = useState(false);
  const [showPickupMapPicker, setShowPickupMapPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [trips, setTrips] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const addTripsMutation = useAddMlTrips({
    onSuccess: (data) => {
      showSuccessToast(data?.message || `${trips.length} trip(s) saved.`, 'Trips submitted');
      setTrips([]);
      setSubmitted(true);
      navigate(`${base}/trips`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit trips.';
      showErrorToast(msg, 'Error');
    },
  });

  const validateLocation = (loc, showManual, prefix) => {
    const next = {};
    const hasMapLink = !!loc.googleMapsUrl?.trim();
    if (!hasMapLink) {
      if (showManual) {
        if (!loc.street?.trim()) next[`${prefix}.street`] = 'Street is required';
        if (!loc.housename?.trim()) next[`${prefix}.housename`] = 'House/Building name is required';
        if (!loc.city?.trim()) next[`${prefix}.city`] = 'City is required';
        if (!loc.pincode?.trim()) next[`${prefix}.pincode`] = 'Pincode is required';
        else if (!/^\d{5,6}$/.test(String(loc.pincode).trim())) next[`${prefix}.pincode`] = 'Enter a valid 5–6 digit pincode';
      } else {
        next[`${prefix}.googleMapsUrl`] = 'Add a map link or add address manually';
      }
    }
    return next;
  };

  const validate = () => {
    const next = {};
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      next.price = 'Enter a valid order amount';
    }
    if (!partnerPayment || isNaN(parseFloat(partnerPayment)) || parseFloat(partnerPayment) < 0) {
      next.partnerPayment = 'Enter the payment you get for this trip (₹)';
    }
    Object.assign(next, validateLocation(pickup, showManualPickup, 'pickup'));
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const getErrorsFor = (prefix) => {
    const out = {};
    Object.keys(errors).forEach((k) => {
      if (k.startsWith(`${prefix}.`)) out[k.replace(`${prefix}.`, '')] = errors[k];
    });
    return out;
  };

  const clearError = (keyOrPrefix) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (keyOrPrefix.includes('.')) delete next[keyOrPrefix];
      else Object.keys(next).filter((k) => k === keyOrPrefix || k.startsWith(`${keyOrPrefix}.`)).forEach((k) => delete next[k]);
      return next;
    });
  };

  const handleAddThisTrip = (e) => {
    e.preventDefault();
    if (!validate()) {
      showErrorToast('Please fix the errors below.', 'Validation');
      return;
    }
    const trip = {
      id: Date.now(),
      platform,
      platformLabel,
      price: parseFloat(price),
      partnerPayment: parseFloat(partnerPayment),
      orderId: (orderId && String(orderId).trim()) || undefined,
      pickup: { ...pickup, pincode: pickup.pincode ? parseInt(pickup.pincode, 10) : '' },
      delivery: {},
    };
    setTrips((prev) => [...prev, trip]);
    setPrice('');
    setPartnerPayment('');
    setOrderId('');
    setPickup(initialLocation);
    setShowManualPickup(false);
    setErrors({});
    showSuccessToast('Trip added to list. Add more or submit all.', 'Trip added');
  };

  const removeTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmitAll = (e) => {
    e.preventDefault();
    if (trips.length === 0) {
      showErrorToast('Add at least one trip first, then submit.', 'No trips');
      return;
    }
    addTripsMutation.mutate(trips);
  };

  const handleAddMore = () => {
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-20 sm:pt-24 pb-24 px-4 max-w-md sm:max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">Add trip(s)</h1>
              <p className="text-sm text-gray-600 mt-0.5">Pickup and order details. Add delivery address later on My Trips.</p>
            </div>
            <span className="flex-shrink-0 text-sm font-semibold text-gray-700 capitalize" style={{ color: accent }}>
              {platformLabel}
            </span>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-white shadow-md border border-gray-100 p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: `${accent}20`, color: accent }}>
                ✓
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">All trips submitted</h2>
              <p className="text-gray-600 text-sm mb-5">You can add more trips below.</p>
              <button
                type="button"
                onClick={handleAddMore}
                className="min-h-[48px] px-6 py-3 rounded-2xl font-semibold text-white shadow-md active:scale-[0.98] transition-transform text-base"
                style={{ backgroundColor: accent }}
              >
                Add more trips
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleAddThisTrip} className="space-y-6">
              {trips.length > 0 && (
                <div className="rounded-xl py-3 px-4 bg-orange-50 border border-orange-100 flex items-center gap-2">
                  <MdLocationOn className="flex-shrink-0" style={{ color: accent }} />
                  <p className="text-sm font-medium text-gray-800">
                    Add another trip — fill the form and click &quot;Add this trip&quot; to add to your list below.
                  </p>
                </div>
              )}
              <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 space-y-4">
                <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">Order details</h2>
                <div>
                  <label htmlFor="trip-price" className="block text-sm font-medium text-gray-700 mb-1">Order amount (₹) <span className="text-red-500">*</span></label>
                  <input
                    id="trip-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                    }}
                    className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                      errors.price ? 'border-red-400' : 'border-gray-200'
                    } focus:border-gray-400 focus:ring-gray-100`}
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600" role="alert">{errors.price}</p>}
                </div>
                <div>
                  <label htmlFor="trip-partner-payment" className="block text-sm font-medium text-gray-700 mb-1">My payment from this trip (₹) <span className="text-red-500">*</span></label>
                  <input
                    id="trip-partner-payment"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={partnerPayment}
                    onChange={(e) => {
                      setPartnerPayment(e.target.value);
                      if (errors.partnerPayment) setErrors((prev) => ({ ...prev, partnerPayment: '' }));
                    }}
                    className={`w-full min-h-[44px] py-3 px-3 rounded-xl border bg-white focus:ring-2 focus:ring-offset-0 text-base ${
                      errors.partnerPayment ? 'border-red-400' : 'border-gray-200'
                    } focus:border-gray-400 focus:ring-gray-100`}
                    aria-invalid={!!errors.partnerPayment}
                  />
                  {errors.partnerPayment && <p className="mt-1 text-sm text-red-600" role="alert">{errors.partnerPayment}</p>}
                  <p className="mt-1 text-xs text-gray-500">Amount you receive as delivery partner for this trip.</p>
                </div>
                <div>
                  <label htmlFor="trip-order-id" className="block text-sm font-medium text-gray-700 mb-1">Order ID <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    id="trip-order-id"
                    type="text"
                    placeholder="e.g. SW123456"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full min-h-[44px] py-3 px-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-offset-0 text-base focus:border-gray-400 focus:ring-gray-100"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 space-y-5">
                <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">Pickup location</h2>
                <LocationBlock
                  title="Pickup location"
                  idPrefix="pickup"
                  location={pickup}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setPickup((prev) => ({ ...prev, [name]: value }));
                    clearError(`pickup.${name}`);
                  }}
                  showManual={showManualPickup}
                  onToggleManual={() => setShowManualPickup((p) => !p)}
                  errors={getErrorsFor('pickup')}
                  clearError={(k) => clearError(`pickup.${k}`)}
                  accent={accent}
                  onOpenMapPicker={() => setShowPickupMapPicker(true)}
                />
                <MapLocationPickerModal
                  isOpen={showPickupMapPicker}
                  onClose={() => setShowPickupMapPicker(false)}
                  onSelect={(loc) => {
                    setPickup({
                      street: loc.street || '',
                      housename: loc.housename || '',
                      city: loc.city || '',
                      pincode: loc.pincode || '',
                      geoLocation: loc.geoLocation || '',
                      googleMapsUrl: loc.googleMapsUrl || '',
                    });
                    clearError('pickup');
                    setShowPickupMapPicker(false);
                  }}
                  accent={accent}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full min-h-[48px] py-3 px-5 rounded-2xl font-semibold text-white shadow-md active:scale-[0.98] transition-transform text-base"
                  style={{ backgroundColor: accent }}
                >
                  {trips.length > 0 ? 'Add this trip to list' : 'Add this trip'}
                </button>
                <Link
                  to={`${base}/dashboard`}
                  className="w-full min-h-[48px] py-3 px-5 rounded-2xl font-semibold text-center border-2 border-gray-300 text-gray-700 active:bg-gray-100 transition-colors text-base flex items-center justify-center"
                >
                  Back to dashboard
                </Link>
              </div>
            </form>
          )}

          {trips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white shadow-md border border-gray-100 p-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdLocationOn style={{ color: accent }} /> Your trips ({trips.length})
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Review your trips below. Add more above or submit all when done.
              </p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {trips.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {t.platformLabel} — Order ₹{t.price.toFixed(2)} · My payment ₹{(t.partnerPayment ?? 0).toFixed(2)}
                      {t.orderId ? ` · #${t.orderId}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTrip(t.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                      aria-label="Remove trip"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Total my payment:</span>
                <span className="font-semibold" style={{ color: accent }}>
                  ₹{trips.reduce((sum, t) => sum + (t.partnerPayment || 0), 0).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={addTripsMutation.isPending}
                className="mt-4 w-full min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-white shadow-md active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-not-allowed text-base"
                style={{ backgroundColor: accent }}
              >
                {addTripsMutation.isPending ? 'Submitting…' : `Submit all ${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MLAddTripPage;
