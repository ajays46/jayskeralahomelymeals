import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMapPin, 
  FiNavigation, 
  FiX, 
  FiCheck, 
  FiPlus, 
  FiHome, 
  FiBriefcase,
  FiMap,
  FiEdit,
  FiTrash2,
  FiChevronDown
} from 'react-icons/fi';
import { MdLocationOn, MdMap } from 'react-icons/md';
import { useAddress } from '../hooks/userHooks/userAddress';
import { toast } from 'react-toastify';
import ConfirmationModal from './ConfirmationModal';

const AddressPicker = ({ 
  value, 
  onChange, 
  placeholder = "Select or add delivery address...",
  className = "",
  showMap = false,
  mealType = "general" // breakfast, lunch, dinner, or general
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddFormDropdown, setShowAddFormDropdown] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    addressId: null,
    addressName: ''
  });
  const inputRef = useRef(null);

  // Use the address hook with React Query
  const { 
    addresses: userAddresses, 
    isLoadingAddresses, 
    addressesError: addressError,
    createAddress, 
    updateAddress,
    deleteAddress,
    clearError,
    isCreating,
    isUpdating,
    isDeleting
  } = useAddress();



  // Form state for adding/editing address
  const [addressForm, setAddressForm] = useState({
    street: '',
    housename: '',
    city: '',
    pincode: '',
    geoLocation: '',
    addressType: 'HOME'
  });



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the entire dropdown container
      const dropdownContainer = document.querySelector('.address-dropdown-container');
      if (inputRef.current && !inputRef.current.contains(event.target) && 
          (!dropdownContainer || !dropdownContainer.contains(event.target))) {
        setShowDropdown(false);
        setShowAddFormDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



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
        setCurrentLocation({ lat: latitude, lng: longitude });
        
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
        setSelectedLocation({ lat, lng, address });
        
        // Pre-fill the address form with detected location
        const addressParts = address.split(', ');
        setAddressForm({
          street: addressParts.slice(0, -3).join(', ') || '',
          housename: '',
          city: addressParts.slice(-3, -1).join(', ') || '',
          pincode: addressParts[addressParts.length - 1] || '',
          geoLocation: `${lat},${lng}`,
          addressType: 'HOME'
        });
        
        // Show success message
        alert('Location detected! Please review and save.');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationError('Could not get address from coordinates.');
    } finally {
      setIsGettingLocation(false);
    }
  };



  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get address type icon
  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'HOME': return <FiHome className="text-blue-500" />;
      case 'OFFICE': return <FiBriefcase className="text-green-500" />;
      case 'OTHER': return <FiMap className="text-gray-500" />;
      default: return <FiMap className="text-gray-500" />;
    }
  };

  // Get address type label
  const getAddressTypeLabel = (type) => {
    switch (type) {
      case 'HOME': return 'Home';
      case 'OFFICE': return 'Office';
      case 'OTHER': return 'Other';
      default: return 'Other';
    }
  };

  // Edit address
  const editAddress = (address) => {
    setAddressForm({
      street: address.street,
      housename: address.housename,
      city: address.city,
      pincode: address.pincode.toString(),
      geoLocation: address.geoLocation,
      addressType: address.addressType
    });
    setSelectedAddress(address);
    setShowAddFormDropdown(true);
  };

  // Delete address
  const handleDeleteAddress = (addressId, addressName) => {
    setDeleteModal({
      isOpen: true,
      addressId,
      addressName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteAddress(deleteModal.addressId);
      
      // Show success toast
      toast.success('Address deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      
      // Show error toast
      toast.error('Failed to delete address. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      addressId: null,
      addressName: ''
    });
  };

  // Save new address or update existing address
  const saveAddress = async () => {
    try {
      // Validate required fields
      if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
        toast.warning('Please fill in all required fields (Street, City, Pincode)', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // Create address data object
      const addressData = {
        street: addressForm.street,
        housename: addressForm.housename,
        city: addressForm.city,
        pincode: parseInt(addressForm.pincode),
        geoLocation: addressForm.geoLocation || '',
        addressType: addressForm.addressType
      };
      
      let savedAddress;
      
      // Check if we're editing an existing address
      if (selectedAddress) {
        // Update existing address
        savedAddress = await updateAddress(selectedAddress.id, addressData);
        toast.success('Address updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Create new address
        savedAddress = await createAddress(addressData);
        toast.success('Address saved successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
      // Update the form value with address ID
      onChange({ target: { value: savedAddress.id } });
      
      // Close form dropdown and reset
      setShowAddFormDropdown(false);
      setSelectedAddress(null);
      setAddressForm({
        street: '',
        housename: '',
        city: '',
        pincode: '',
        geoLocation: '',
        addressType: 'HOME'
      });
      
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error saving address. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };



  return (
    <div className="relative">
      {/* Address Dropdown */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={() => {}} // Read-only
            placeholder={placeholder}
            className={`w-full pl-10 pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm lg:text-base cursor-pointer ${className}`}
            onClick={() => setShowDropdown(!showDropdown)}
            readOnly
          />
          
          {/* Location Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <FiMapPin className="text-gray-400 text-sm sm:text-base" />
          </div>

          {/* Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <FiChevronDown className={`text-gray-400 text-sm sm:text-base transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="address-dropdown-container absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Add New Address Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddFormDropdown(true);
              }}
              className="w-full p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2 text-left"
            >
              <FiPlus className="text-orange-500" />
              <span className="text-sm font-medium text-orange-600">Add New Address</span>
            </button>
            {/* Add/Edit Address Form Dropdown */}
            {showAddFormDropdown && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="text-sm font-medium text-gray-800 mb-3">
                  {selectedAddress ? 'Edit Address' : 'Add New Address'}
                </div>
                <form className="space-y-3" onSubmit={(e) => {
                  e.preventDefault();
                  saveAddress();
                }}>
                  {/* House Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      House/Building Name
                    </label>
                    <input
                      type="text"
                      name="housename"
                      value={addressForm.housename}
                      onChange={handleFormChange}
                      placeholder="e.g., Green Villa"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={addressForm.street}
                      onChange={handleFormChange}
                      placeholder="e.g., 123 Main Street"
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleFormChange}
                      placeholder="e.g., Kochi"
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="number"
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={handleFormChange}
                      placeholder="e.g., 682001"
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Address Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <select
                      name="addressType"
                      value={addressForm.addressType}
                      onChange={handleFormChange}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                      disabled={isGettingLocation}
                      className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded text-xs hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <MdLocationOn className="text-gray-600 text-sm" />
                      <span className="text-xs text-gray-700">
                        {isGettingLocation ? 'Getting location...' : 'Use my current location'}
                      </span>
                    </button>
                  </div>

                  {/* Geolocation (hidden but populated) */}
                  <input
                    type="hidden"
                    name="geoLocation"
                    value={addressForm.geoLocation}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFormDropdown(false);
                        setSelectedAddress(null);
                        setAddressForm({
                          street: '',
                          housename: '',
                          city: '',
                          pincode: '',
                          geoLocation: '',
                          addressType: 'HOME'
                        });
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          {selectedAddress ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <FiCheck size={12} />
                          {selectedAddress ? 'Update' : 'Save'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Saved Addresses */}
            {isLoadingAddresses ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Loading addresses...</p>
              </div>
            ) : userAddresses.length > 0 ? (
              userAddresses.map((address) => (
                <div
                  key={address.id}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    const fullAddress = `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
                    // Send the address ID instead of the full address string
                    onChange({ target: { value: address.id } });
                    setSelectedAddress(address);
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getAddressTypeIcon(address.addressType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {getAddressTypeLabel(address.addressType)}
                        </span>
                        {address.housename && (
                          <span className="text-xs text-gray-500">({address.housename})</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{address.street}</p>
                      <p className="text-sm text-gray-600">
                        {address.city} - {address.pincode}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editAddress(address);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit address"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const addressName = `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
                          handleDeleteAddress(address.id, addressName);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete address"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <FiMapPin className="text-gray-400 text-2xl mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No saved addresses</p>
                <p className="text-gray-400 text-xs">Add your first address to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs sm:text-sm">{locationError}</p>
        </div>
      )}

      {/* Current Location Indicator */}
      {selectedLocation && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiCheck className="text-green-500 text-sm" />
            <p className="text-green-700 text-xs sm:text-sm">Location detected from GPS</p>
          </div>
        </div>
      )}

      {/* Address Error */}
      {addressError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs sm:text-sm">{addressError.message || addressError}</p>
          <button 
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Address"
        message={`Are you sure you want to delete "${deleteModal.addressName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default AddressPicker; 