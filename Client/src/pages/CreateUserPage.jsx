import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { 
  MdArrowBack,
  MdSave,
  MdCancel,
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdAdd,
  MdEdit
} from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useSeller } from '../hooks/sellerHooks/useSeller';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { createContact, updateCustomer } = useSeller();
  
  // Check if we're in edit mode
  const editCustomer = location.state?.editUser;
  const isEditMode = !!editCustomer;
  
  // State management
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    
    // Address
    street: '',
    housename: '',
    city: '',
    pincode: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form data when in edit mode
  useEffect(() => {
    if (isEditMode && editCustomer) {
      const contact = editCustomer.contacts?.[0];
      const address = editCustomer.addresses?.[0];
      
      setFormData({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        phoneNumber: contact?.phoneNumbers?.[0]?.number || '',
        
        street: address?.street || '',
        housename: address?.housename || '',
        city: address?.city || '',
        pincode: address?.pincode || ''
      });
    }
  }, [isEditMode, editCustomer]);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    // Validate pincode if provided
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear API error when user starts typing
    if (apiError) {
      setApiError('');
    }
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setApiError(''); // Clear any previous API errors
    setSuccessMessage(''); // Clear any previous success messages
    
    try {
      if (isEditMode) {
        // Edit mode - update existing customer
        const updateData = {
          contact: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumbers: [{
              number: formData.phoneNumber.replace(/\D/g, '')
            }]
          },
          address: {
            street: formData.street,
            housename: formData.housename,
            city: formData.city,
            pincode: formData.pincode
          }
        };
        
        const result = await updateCustomer(editCustomer.id, updateData);
        
        if (result.success) {
          setSuccessMessage('Customer updated successfully!');
          // Navigate back to customers list after a short delay
          setTimeout(() => {
            navigate('/jkhm/seller/customers');
          }, 1500);
        }
      } else {
        // Create mode - create new customer
        const createData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber.replace(/\D/g, '')
        };
        
        // Only add address if any address field is filled
        if (formData.street.trim() || formData.housename.trim() || formData.city.trim() || formData.pincode.trim()) {
          createData.address = {
            street: formData.street,
            housename: formData.housename,
            city: formData.city,
            pincode: formData.pincode
          };
        }
        
        // Use the hook to create the customer
        const result = await createContact(createData);
        
        if (result.success) {
          setSuccessMessage('Customer created successfully! Redirecting to booking...');
          // Navigate to BookingWizardPage with the newly created customer pre-selected and go to menu selection
          setTimeout(() => {
            navigate('/jkhm/place-order', { 
              state: { 
                selectedUser: result.data,
                fromCreateUser: true,
                initialTab: 'menu' // This will set the initial tab to menu selection
              } 
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle different types of errors
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        setApiError(errorMessage);
        
        // If it's a phone number duplicate error, also set field-specific error
        if (errorMessage.toLowerCase().includes('phone number') && errorMessage.toLowerCase().includes('already registered')) {
          setErrors(prev => ({
            ...prev,
            phoneNumber: 'This phone number is already registered'
          }));
        }
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/jkhm/seller/customers');
  };

  // Check if user has access
  if (!user || !roles?.includes('SELLER')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to create customers.</p>
          <button
            onClick={() => navigate('/jkhm')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-4">
            {/* Left Side - Back Button and Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/jkhm/seller/customers')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Customers"
              >
                <MdArrowBack className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {isEditMode ? 'Edit Customer' : 'Create New Customer'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {isEditMode 
                    ? `Edit ${editCustomer?.contacts?.[0]?.firstName} ${editCustomer?.contacts?.[0]?.lastName}'s information`
                    : 'Add a new customer and start booking'
                  }
                </p>
              </div>
            </div>
            
            {/* Right Side - Action Buttons */}
            <div className="flex flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <MdCancel className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-3 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  isEditMode ? <MdEdit className="w-4 h-4" /> : <MdAdd className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {saving 
                    ? (isEditMode ? 'Saving...' : 'Creating...') 
                    : (isEditMode ? 'Save Changes' : 'Create & Book')
                  }
                </span>
                <span className="sm:hidden">
                  {saving 
                    ? (isEditMode ? 'Saving...' : 'Creating...') 
                    : (isEditMode ? 'Save' : 'Create')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Success Message Display */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="text-sm font-medium text-green-800">
                  Success
                </h3>
                <div className="mt-1 sm:mt-2 text-sm text-green-700">
                  <p className="break-words">{successMessage}</p>
                </div>
                <div className="mt-2 sm:mt-3">
                  <button
                    type="button"
                    onClick={() => setSuccessMessage('')}
                    className="bg-green-50 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Error Display */}
        {apiError && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-1 sm:mt-2 text-sm text-red-700">
                  <p className="break-words">{apiError}</p>
                </div>
                <div className="mt-2 sm:mt-3">
                  <button
                    type="button"
                    onClick={() => setApiError('')}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column - Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MdPerson className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phoneNumber || (apiError && apiError.toLowerCase().includes('phone number')) ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                  )}
                  {apiError && apiError.toLowerCase().includes('phone number') && !errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{apiError}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MdLocationOn className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Address Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Name
                  </label>
                  <input
                    type="text"
                    name="housename"
                    value={formData.housename}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter house name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.pincode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
            

          </form>

          {/* Right Column - Information */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Information Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MdPerson className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Information
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    <MdAdd className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {isEditMode ? 'Edit Customer' : 'New Customer'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {isEditMode 
                        ? 'Updating customer information'
                        : 'Creating a new customer and starting booking'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <MdPerson className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span>Fill in all required fields marked with *</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <MdPhone className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span>Phone number for contact purposes</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span>Address fields are optional</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-blue-600">
                    <div className="mt-0.5 flex-shrink-0">
                      {isEditMode ? <MdEdit className="w-3 h-3 sm:w-4 sm:h-4" /> : <MdAdd className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </div>
                    <span>
                      {isEditMode 
                        ? 'Changes will be saved to the customer profile'
                        : 'Customer will be created and ready for booking'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
              
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => navigate('/jkhm/customers')}
                  className="w-full px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MdArrowBack className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Customers</span>
                  <span className="sm:hidden">Back to Customers</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPage;
