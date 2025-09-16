import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
} from '../utils/toastConfig.jsx';
import ConfirmationModal from './ConfirmationModal';

const AddressPicker = ({ 
  value, 
  onChange, 
  placeholder = "Select or add delivery address...",
  className = "",
  showMap = false,
  mealType = "general", // breakfast, lunch, dinner, or general
  addresses = null, // Optional: override default addresses (for seller-selected users)
  onAddressCreate = null, // Optional: callback for creating addresses for seller-selected users
  selectedUserId = null, // Optional: ID of the user for whom we're managing addresses
  disabled = false // Optional: disable the input
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddFormDropdown, setShowAddFormDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0
  });
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

  // Use provided addresses if available, otherwise use user addresses
  const addressesToUse = addresses || userAddresses;
  const isLoadingAddressesForDisplay = addresses ? false : isLoadingAddresses;
  const addressErrorForDisplay = addresses ? null : addressError;

  // Form state for adding/editing address
  const [addressForm, setAddressForm] = useState({
    street: '',
    housename: '',
    city: '',
    pincode: '',
    geoLocation: '',
    googleMapsUrl: '',
    addressType: 'HOME'
  });

  // Close dropdown when clicking outside and update position on scroll/resize
  useEffect(() => {
    // Update dropdown position when scrolling or resizing
    const updateDropdownPosition = () => {
      if (inputRef.current && showDropdown) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 5,
          left: rect.left,
          width: rect.width
        });
      }
    };

    // Close dropdown when clicking outside
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
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showDropdown]);

  // Update position when dropdown opens
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5,
        left: rect.left,
        width: rect.width
      });
    }
  }, [showDropdown]);

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
          googleMapsUrl: '',
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
      googleMapsUrl: address.googleMapsUrl || '',
      addressType: address.addressType
    });
    setSelectedAddress(address);
    setShowAddFormDropdown(true);
  };

  // Handle address creation
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    
    // If addresses are provided externally (seller-selected user), allow creation
    if (addresses) {
      // Call saveAddress which will handle seller-selected users
      await saveAddress();
      return;
    }
    
    if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    try {
      const newAddress = await createAddress({
        ...addressForm,
        geoLocation: currentLocation || selectedLocation
      });

      if (newAddress) {
        setAddressForm({
          street: '',
          housename: '',
          city: '',
          pincode: '',
          geoLocation: '',
          googleMapsUrl: '',
          addressType: 'HOME'
        });
        setShowAddForm(false);
        setCurrentLocation(null);
        setSelectedLocation(null);
        showSuccessToast('Address added successfully!');
      }
    } catch (error) {
      console.error('Error creating address:', error);
    }
  };

  // Handle address update
  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    
    // If addresses are provided externally (seller-selected user), show message
    if (addresses) {
      showInfoToast('Address management is handled by the seller for this user');
      return;
    }
    
    if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    try {
      const updatedAddress = await updateAddress({
        id: selectedAddress.id,
        ...addressForm,
        geoLocation: currentLocation || selectedLocation
      });

      if (updatedAddress) {
        setAddressForm({
          street: '',
          housename: '',
          city: '',
          pincode: '',
          geoLocation: '',
          googleMapsUrl: '',
          addressType: 'HOME'
        });
        setShowAddForm(false);
        setSelectedAddress(null);
        setCurrentLocation(null);
        setSelectedLocation(null);
        showSuccessToast('Address updated successfully!');
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  // Handle address deletion
  const handleDeleteAddress = async () => {
    // If addresses are provided externally (seller-selected user), show message
    if (addresses) {
      showInfoToast('Address management is handled by the seller for this user');
      setDeleteModal({ isOpen: false, addressId: null, addressName: '' });
      return;
    }
    
    try {
      const success = await deleteAddress(deleteModal.addressId);
      if (success) {
        showSuccessToast('Address deleted successfully!');
        setDeleteModal({ isOpen: false, addressId: null, addressName: '' });
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const confirmDelete = async () => {
    // If addresses are provided externally (seller-selected user), show message
    if (addresses) {
      showInfoToast('Address management is handled by the seller for this user');
      closeDeleteModal();
      return;
    }
    
    try {
      await deleteAddress(deleteModal.addressId);
      
      // Show success toast
      showSuccessToast('Address deleted successfully!');
    } catch (error) {
      console.error('Error deleting address:', error);
      
      // Show error toast
      showErrorToast('Failed to delete address. Please try again.');
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
    // If addresses are provided externally (seller-selected user), allow creation for that user
    if (addresses) {
      // This means we're managing addresses for a seller-selected user
      // We'll need to create the address through a different API endpoint
      try {
        // Validate required fields
        if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
          showWarningToast('Please fill in all required fields (Street, City, Pincode)');
          return;
        }

        // Create address data object
        const addressData = {
          street: addressForm.street,
          housename: addressForm.housename,
          city: addressForm.city,
          pincode: parseInt(addressForm.pincode),
          geoLocation: addressForm.geoLocation || '',
          googleMapsUrl: addressForm.googleMapsUrl || '',
          addressType: addressForm.addressType
        };

        // For seller-selected users, create address through the callback
        if (onAddressCreate && selectedUserId) {
          try {
            const savedAddress = await onAddressCreate(selectedUserId, addressData);
            if (savedAddress) {
              showSuccessToast('Address created successfully for the selected user!');
              
              // Update the form value with address ID
              onChange({ target: { value: savedAddress.id, displayName: `${savedAddress.housename ? savedAddress.housename + ', ' : ''}${savedAddress.street}, ${savedAddress.city} - ${savedAddress.pincode}` } });
              
              // Close form dropdown and reset
              setShowAddFormDropdown(false);
              setSelectedAddress(null);
              setAddressForm({
                street: '',
                housename: '',
                city: '',
                pincode: '',
                geoLocation: '',
                googleMapsUrl: '',
                addressType: 'HOME'
              });
            }
          } catch (error) {
            console.error('Error creating address for user:', error);
            showErrorToast('Failed to create address for the selected user. Please try again.');
          }
          return;
        }
        
        showErrorToast('Address creation not configured for seller-selected users');
        return;
      } catch (error) {
        console.error('Error preparing address data:', error);
        return;
      }
    }
    
    try {
      // Validate required fields
      if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
        showWarningToast('Please fill in all required fields (Street, City, Pincode)');
        return;
      }

      // Create address data object
      const addressData = {
        street: addressForm.street,
        housename: addressForm.housename,
        city: addressForm.city,
        pincode: parseInt(addressForm.pincode),
        geoLocation: addressForm.geoLocation || '',
        googleMapsUrl: addressForm.googleMapsUrl || '',
        addressType: addressForm.addressType
      };
      
      let savedAddress;
      
      // Check if we're editing an existing address
      if (selectedAddress) {
        // Update existing address
        savedAddress = await updateAddress(selectedAddress.id, addressData);
        showSuccessToast('Address updated successfully!');
      } else {
        // Create new address
        savedAddress = await createAddress(addressData);
        showSuccessToast('Address saved successfully!');
      }
      
      // Update the form value with address ID
      onChange({ target: { value: savedAddress.id, displayName: `${savedAddress.housename ? savedAddress.housename + ', ' : ''}${savedAddress.street}, ${savedAddress.city} - ${savedAddress.pincode}` } });
      
      // Close form dropdown and reset
      setShowAddFormDropdown(false);
      setSelectedAddress(null);
      setAddressForm({
        street: '',
        housename: '',
        city: '',
        pincode: '',
        geoLocation: '',
        googleMapsUrl: '',
        addressType: 'HOME'
      });
      
    } catch (error) {
      console.error('Error saving address:', error);
      showErrorToast('Error saving address. Please try again.');
    }
  };

  return (
    <div className="relative z-[9999]">
      {/* Address Dropdown */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={() => {}} // Read-only
            placeholder={placeholder}
            className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm lg:text-base ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'cursor-pointer'} ${className}`}
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            readOnly
            disabled={disabled}
          />
          
          {/* Location Icon */}
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
            <FiMapPin className="text-gray-400 text-sm sm:text-base" />
          </div>

          {/* Dropdown Arrow */}
          <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
            <FiChevronDown className={`text-gray-400 text-sm sm:text-base transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && createPortal(
          <div className="address-dropdown-container fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[99999] max-h-96 overflow-y-auto" style={{ 
            minHeight: '200px', 
            maxHeight: '400px',
            top: inputRef.current ? Math.min(inputRef.current.getBoundingClientRect().bottom + 5, window.innerHeight - 250) : 'auto',
            left: inputRef.current ? Math.max(0, Math.min(inputRef.current.getBoundingClientRect().left, window.innerWidth - 300)) : 'auto',
            width: inputRef.current ? Math.min(inputRef.current.offsetWidth, window.innerWidth - 20) : 'auto',
            maxWidth: 'calc(100vw - 20px)'
          }}>
            {/* Add New Address Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddFormDropdown(true);
              }}
              className="w-full p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
            >
              <FiPlus className="text-orange-500 flex-shrink-0 w-5 h-5" />
              <span className="text-sm sm:text-base font-medium text-orange-600">Add New Address</span>
            </button>
            {/* Add/Edit Address Form Dropdown */}
            {showAddFormDropdown && (
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                <div className="text-xs sm:text-sm font-medium text-gray-800 mb-2 sm:mb-3">
                  {selectedAddress ? 'Edit Address' : 'Add New Address'}
                </div>
                <form className="space-y-2 sm:space-y-3" onSubmit={(e) => {
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
                      <MdLocationOn className="text-gray-600 text-sm flex-shrink-0" />
                      <span className="text-xs text-gray-700">
                        {isGettingLocation ? 'Getting location...' : 'Use my current location'}
                      </span>
                    </button>
                  </div>

                  {/* Google Maps URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Google Maps URL
                    </label>
                    <input
                      type="url"
                      name="googleMapsUrl"
                      value={addressForm.googleMapsUrl}
                      onChange={handleFormChange}
                      placeholder="e.g., https://maps.app.goo.gl/2NTAhAJVUsvh5sEr6"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Paste a Google Maps share URL for precise location
                    </p>
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
                          googleMapsUrl: '',
                          addressType: 'HOME'
                        });
                      }}
                      className="flex-1 px-2 sm:px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="flex-1 px-2 sm:px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">{selectedAddress ? 'Updating...' : 'Saving...'}</span>
                          <span className="sm:hidden">{selectedAddress ? 'Update' : 'Save'}</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={12} />
                          <span className="hidden sm:inline">{selectedAddress ? 'Update' : 'Save'}</span>
                          <span className="sm:hidden">{selectedAddress ? 'Update' : 'Save'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Saved Addresses */}
            {isLoadingAddressesForDisplay ? (
              <div className="p-3 sm:p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">Loading addresses...</p>
              </div>
            ) : addressesToUse.length > 0 ? (
              addressesToUse.map((address) => (
                <div
                  key={address.id}
                  className="p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    const fullAddress = `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
                    // Send both the address ID and the display name
                    onChange({ target: { value: address.id, displayName: fullAddress } });
                    setSelectedAddress(address);
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Address Info Row */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1 flex-shrink-0">
                        {getAddressTypeIcon(address.addressType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm sm:text-base font-medium text-gray-800">
                            {getAddressTypeLabel(address.addressType)}
                          </span>
                          {address.housename && (
                            <span className="text-xs sm:text-sm text-gray-500">({address.housename})</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1 break-words">{address.street}</p>
                        <p className="text-sm text-gray-600 break-words">
                          {address.city} - {address.pincode}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons Row - Below address on mobile, to the right on desktop */}
                    <div className="flex gap-2 sm:ml-auto sm:mt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editAddress(address);
                        }}
                        className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50 flex items-center justify-center gap-2 sm:gap-1"
                        title="Edit address"
                      >
                        <FiEdit size={16} className="w-4 h-4" />
                        <span className="text-xs sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const addressName = `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
                          handleDeleteAddress(address.id, addressName);
                        }}
                        className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50 flex items-center justify-center gap-2 sm:gap-1"
                        title="Delete address"
                      >
                        <FiTrash2 size={16} className="w-4 h-4" />
                        <span className="text-xs sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 sm:p-4 text-center">
                <FiMapPin className="text-gray-400 text-xl sm:text-2xl mx-auto mb-2" />
                <p className="text-gray-500 text-xs sm:text-sm">No saved addresses</p>
                <p className="text-gray-400 text-xs mt-1">Add your first address to get started</p>
              </div>
            )}
          </div>,
          document.body
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
            <FiCheck className="text-green-500 text-sm flex-shrink-0" />
            <p className="text-green-700 text-xs sm:text-sm">Location detected from GPS</p>
          </div>
        </div>
      )}

      {/* Address Error */}
      {addressErrorForDisplay && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          {addressErrorForDisplay.message?.includes('401') || addressErrorForDisplay.message?.includes('unauthorized') ? (
            <div>
              <p className="text-red-600 text-xs sm:text-sm mb-2">Please log in to manage your addresses</p>
              <button 
                onClick={() => {
                  clearError();
                  // Trigger the auth slider to open
                  const event = new CustomEvent('openAuthSlider');
                  window.dispatchEvent(event);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Log In
              </button>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700 text-xs underline ml-3"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600 text-xs sm:text-sm">{addressErrorForDisplay.message || addressErrorForDisplay}</p>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700 text-xs underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
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