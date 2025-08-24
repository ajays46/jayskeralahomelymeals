import React, { useState } from 'react';
import { FaBuilding, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import AdminSlide from '../../components/AdminSlide';
import { useCreateCompany, useCompanyList, useCompanyDelete } from '../../hooks/adminHook/adminHook';
import { Popconfirm, Button } from 'antd';
import 'antd/dist/reset.css'; // or 'antd/dist/antd.css' for older versions

const CompanyCreatePage = () => {
  const { data: companyList } = useCompanyList();
  const { mutateAsync: deleteCompany, isLoading: isDeleting } = useCompanyDelete();
  const companies = Array.isArray(companyList) ? companyList : companyList?.data || [];
  const [form, setForm] = useState({
    name: '',
    address: {
      street: '',
      housename: '',
      city: '',
      pincode: '',
      geoLocation: '',
      addressType: 'HOME'
    },
    created_at: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString().slice(0, 10),
  });

  // Geo location states
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const {
    mutate: createCompany,
    isLoading,
    isError,
    isSuccess,
    error,
    reset
  } = useCreateCompany();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (isError || isSuccess) reset();
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        
        // Pre-fill the address form with detected location
        const addressParts = address.split(', ');
        setForm(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: addressParts.slice(0, -3).join(', ') || '',
            housename: '',
            city: addressParts.slice(-3, -1).join(', ') || '',
            pincode: addressParts[addressParts.length - 1] || '',
            geoLocation: `${lat},${lng}`,
            addressType: 'HOME'
          }
        }));
        
        // Show success message
        alert('Location detected! Please review and save the address details.');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationError('Could not get address from coordinates.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required address fields
    const { street, housename, city, pincode } = form.address;
    if (!street || !housename || !city || !pincode) {
      alert('Please fill in all required address fields');
      return;
    }

    createCompany(
      {
        name: form.name,
        address: form.address,
      },
      {
        onSuccess: () => {
          setForm({
            name: '',
            address: {
              street: '',
              housename: '',
              city: '',
              pincode: '',
              geoLocation: '',
              addressType: 'HOME'
            },
            created_at: new Date().toISOString().slice(0, 10),
            updated_at: new Date().toISOString().slice(0, 10),
          });
          setLocationError('');
        },
      }
    );
  };

  const handleDelete = (id) => {
    deleteCompany(id);
  };

  const formatAddress = (address) => {
    if (!address) return 'No address';
    const parts = [
      address.street,
      address.housename,
      address.city,
      address.pincode,
      address.geoLocation
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSlide />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-3 sm:p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Left: Creation Form */}
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                  <FaBuilding size={32} className="text-teal-400 mb-2 drop-shadow sm:text-4xl" />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-teal-300 text-center tracking-wide">Create Company</h2>
                </div>
                
                {isSuccess && (
                  <div className="mb-4 text-green-400 font-semibold text-center text-sm sm:text-base">
                    Company created successfully!
                  </div>
                )}
                {isError && (
                  <div className="mb-4 text-red-400 font-semibold text-center text-sm sm:text-base">
                    {error?.response?.data?.message || 'Failed to create company'}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block mb-1 text-xs sm:text-sm text-gray-400">Company Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                      disabled={isLoading} 
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Address Section */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FaMapMarkerAlt className="text-teal-400" />
                      <h4 className="text-sm sm:text-base font-semibold text-teal-300">Company Address</h4>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {/* Street */}
                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-400">Street *</label>
                        <input 
                          type="text" 
                          name="address.street" 
                          value={form.address.street} 
                          onChange={handleChange} 
                          required 
                          className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                          disabled={isLoading} 
                          placeholder="Enter street"
                        />
                      </div>

                      {/* House Name and City */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-xs sm:text-sm text-gray-400">House/Building Name *</label>
                          <input 
                            type="text" 
                            name="address.housename" 
                            value={form.address.housename} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                            disabled={isLoading} 
                            placeholder="Enter house/building name"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs sm:text-sm text-gray-400">City *</label>
                          <input 
                            type="text" 
                            name="address.city" 
                            value={form.address.city} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                            disabled={isLoading} 
                            placeholder="Enter city"
                          />
                        </div>
                      </div>

                      {/* Pincode and Geo Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-xs sm:text-sm text-gray-400">Pincode *</label>
                          <input 
                            type="number" 
                            name="address.pincode" 
                            value={form.address.pincode} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                            disabled={isLoading} 
                            placeholder="Enter pincode"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs sm:text-sm text-gray-400">Geo Location</label>
                          <input 
                            type="text" 
                            name="address.geoLocation" 
                            value={form.address.geoLocation} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                            disabled={isLoading} 
                            placeholder="Coordinates (lat,lng) or location name"
                          />
                        </div>
                      </div>

                      {/* Address Type */}
                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-400">Address Type</label>
                        <select 
                          name="address.addressType" 
                          value={form.address.addressType} 
                          onChange={handleChange} 
                          className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-100 text-sm sm:text-base" 
                          disabled={isLoading}
                        >
                          <option value="HOME">Home</option>
                          <option value="OFFICE">Office</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      {/* Location Options */}
                      <div className="space-y-2">
                        {/* Use Current Location */}
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation || isLoading}
                          className="w-full flex items-center gap-2 p-3 border border-teal-600 rounded text-sm hover:bg-teal-600 hover:text-white transition-colors disabled:opacity-50 bg-transparent text-teal-400"
                        >
                          <MdLocationOn className="text-current text-lg flex-shrink-0" />
                          <span className="text-sm">
                            {isGettingLocation ? 'Getting location...' : 'Use my current location'}
                          </span>
                        </button>
                        
                        {/* Location Error */}
                        {locationError && (
                          <div className="text-red-400 text-xs text-center p-2 bg-red-900/20 rounded border border-red-600/30">
                            {locationError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-400">Created At</label>
                      <input 
                        type="date" 
                        name="created_at" 
                        value={form.created_at} 
                        readOnly 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-400 text-sm sm:text-base" 
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-400">Updated At</label>
                      <input 
                        type="date" 
                        name="updated_at" 
                        value={form.updated_at} 
                        readOnly 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 sm:p-3 text-gray-400 text-sm sm:text-base" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-teal-600 text-white py-2 sm:py-3 rounded font-semibold hover:bg-teal-700 transition text-sm sm:text-base" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Company'}
                  </button>
                </form>
              </div>
              
              {/* Right: Companies List */}
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold mb-4 sm:mb-6 text-teal-400 flex items-center gap-2 tracking-wide">
                  <FaBuilding className="text-teal-300" /> Created Companies
                </h3>
                
                {companies.length === 0 ? (
                  <div className="text-gray-400 text-center text-sm sm:text-base">No companies found.</div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-lg p-3 sm:p-5 flex items-center gap-3 sm:gap-5 hover:shadow-2xl transition-shadow border border-gray-700 hover:border-teal-400"
                      >
                        <div className="flex-shrink-0 bg-teal-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm sm:text-lg text-teal-200 truncate">{company.name}</div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 flex items-start gap-2">
                              <FaMapMarkerAlt className="text-teal-400 mt-1 flex-shrink-0" />
                              <span className="text-gray-300 leading-relaxed">
                                {formatAddress(company.address)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Popconfirm
                          title="Are you sure you want to delete this company?"
                          onConfirm={async () => {
                            await deleteCompany(company.id);
                          }}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<FaTrash />}
                            className="ml-2 flex-shrink-0"
                          />
                        </Popconfirm>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-20">
        <AdminSlide isFooter />
      </div>
    </div>
  );
};

export default CompanyCreatePage; 