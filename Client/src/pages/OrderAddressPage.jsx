import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiNavigation } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCompanyBasePath } from '../context/TenantContext';
import useAuthStore from '../stores/Zustand.store';
import { useAddress } from '../hooks/userHooks/userAddress';
import { showErrorToast, showSuccessToast } from '../utils/toastConfig.jsx';

const toSixDigitPincode = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.slice(0, 6);
};

const getInitialName = (user) => {
  if (!user) return '';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.fullName || '';
};

const OrderAddressPage = () => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();
  const { user } = useAuthStore();
  const { createAddress, isCreating } = useAddress();
  const [customerName, setCustomerName] = useState(() => getInitialName(user));
  const [addressForm, setAddressForm] = useState({
    housename: '',
    street: '',
    city: '',
    pincode: '',
    geoLocation: '',
    addressType: 'HOME',
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationResult, setLocationResult] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);

  const hasManualAddress = useMemo(
    () => Boolean(addressForm.street.trim() || addressForm.city.trim() || addressForm.pincode.trim()),
    [addressForm.city, addressForm.pincode, addressForm.street]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: name === 'pincode' ? toSixDigitPincode(value) : value,
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    const parts = data?.address || {};
    const streetName = [parts.road, parts.neighbourhood, parts.suburb].filter(Boolean).join(', ');
    const cityName = parts.city || parts.town || parts.village || parts.state_district || '';
    const postal = toSixDigitPincode(parts.postcode);
    setAddressForm((prev) => ({
      ...prev,
      street: streetName || prev.street,
      city: cityName || prev.city,
      pincode: postal || prev.pincode,
      geoLocation: `${lat},${lng}`,
    }));
    const resolvedAddress =
      data?.display_name ||
      [streetName, cityName, postal].filter(Boolean).join(', ') ||
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setLocationResult(resolvedAddress);
  };

  const handleUseCurrentLocation = () => {
    setLocationError('');
    setLocationResult('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await reverseGeocode(latitude, longitude);
          showSuccessToast('Current location added. Please confirm address details.');
        } catch (error) {
          setLocationError('Could not read address from your current location.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location access denied. Please enable location permission.');
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Location request timed out. Please try again.');
        } else {
          setLocationError('Unable to fetch your current location.');
        }
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  };

  const handleContinue = async (event) => {
    event.preventDefault();

    if (!customerName.trim()) {
      showErrorToast('Please enter your name.');
      return;
    }

    if (!hasManualAddress) {
      showErrorToast('Add address manually or use current location.');
      return;
    }

    if (!addressForm.street.trim() || !addressForm.city.trim() || addressForm.pincode.length !== 6) {
      showErrorToast('Street, city and valid 6-digit pincode are required.');
      return;
    }

    try {
      const savedAddress = await createAddress({
        street: addressForm.street.trim(),
        housename: addressForm.housename.trim(),
        city: addressForm.city.trim(),
        pincode: addressForm.pincode ? Number(addressForm.pincode) : 0,
        geoLocation: addressForm.geoLocation,
        addressType: addressForm.addressType,
      });

      const displayName = `${savedAddress.housename ? `${savedAddress.housename}, ` : ''}${savedAddress.street}, ${savedAddress.city} - ${savedAddress.pincode}`;

      navigate(`${basePath}/order`, {
        state: {
          prefilledAddressId: savedAddress.id,
          prefilledAddressDisplay: displayName,
          prefilledCustomerName: customerName.trim(),
        },
      });
    } catch (error) {
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to save address.');
    }
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
      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mx-auto flex min-h-full w-full max-w-2xl items-start sm:items-center">
          <div className="w-full rounded-2xl border border-[#ddd8cc] bg-white p-4 sm:p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <h1 className="text-center text-2xl font-black text-[#1f2e2a]">Where should we deliver?</h1>
          <p className="mt-1 text-center text-sm text-[#6b6a64]">Add your name and delivery address.</p>

            <form onSubmit={handleContinue} className="mt-6 space-y-4">
            <div>
              <label htmlFor="customerName" className="mb-1 block text-sm font-semibold text-[#1f2e2a]">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="rounded-xl border border-[#ece5d8] bg-[#fcfaf5] p-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1f6f5f] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGettingLocation ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <FiNavigation />
                  )}
                  {isGettingLocation ? 'Getting current location...' : 'Get Current Location'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualFields((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1f6f5f] px-3 py-2 text-sm font-semibold text-[#1f6f5f] transition hover:bg-[#eef7f4]"
                >
                  {showManualFields ? 'Use GPS' : 'Type Address'}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#6b6a64]">Click Type Address to enter house, street, city, and pincode.</p>
            </div>

            {locationError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {locationError}
              </div>
            ) : locationResult ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <p className="break-words">{locationResult}</p>
              </div>
            ) : null}

            {showManualFields && (
              <>
                <div>
                  <label htmlFor="housename" className="mb-1 block text-sm font-semibold text-[#1f2e2a]">
                    House / Building (optional)
                  </label>
                  <input
                    id="housename"
                    type="text"
                    name="housename"
                    value={addressForm.housename}
                    onChange={handleChange}
                    placeholder="Flat, villa, landmark"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="street" className="mb-1 block text-sm font-semibold text-[#1f2e2a]">
                    Street Address
                  </label>
                  <textarea
                    id="street"
                    name="street"
                    value={addressForm.street}
                    onChange={handleChange}
                    placeholder="Door no, street, area"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="mb-1 block text-sm font-semibold text-[#1f2e2a]">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="mb-1 block text-sm font-semibold text-[#1f2e2a]">
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      inputMode="numeric"
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </>
            )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-xl bg-[#1f6f5f] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Saving address...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderAddressPage;
