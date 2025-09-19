import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';
import { 
  MdArrowBack,
  MdSave,
  MdCancel,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCalendarToday,
  MdShoppingCart,
  MdAttachMoney
} from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useSeller } from '../hooks/sellerHooks/useSeller';

const EditCustomerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { updateCustomer } = useSeller();
  
  // Get customer data from navigation state
  const customer = location.state?.editUser;
  
  // State management
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    
    // Address
    street: '',
    city: '',
    pincode: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when customer data is available
  useEffect(() => {
    if (customer) {
      const contact = customer.contacts?.[0];
      const address = customer.addresses?.[0];
      
      setFormData({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        phoneNumber: contact?.phoneNumbers?.[0]?.number || '',
        
        street: address?.street || '',
        city: address?.city || '',
        pincode: address?.pincode ? String(address.pincode) : ''
      });
    }
  }, [customer]);

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
    
    if (!formData.city || !String(formData.city).trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.pincode || !String(formData.pincode).trim()) {
      newErrors.pincode = 'Pincode is required';
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
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarningToast('Please fix the errors before saving');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare the data for the backend
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
          city: formData.city,
          pincode: formData.pincode
        }
      };
      
      // Use the hook to update the customer
      const result = await updateCustomer(customer.id, updateData);
      
      if (result.success) {
        showSuccessToast('Customer updated successfully!');
        navigate('/jkhm/seller/customers');
      } else {
        showErrorToast(result.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showErrorToast(error.message || 'Failed to update customer. Please try again.');
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
          <p className="text-gray-600 mb-4">You don't have permission to edit customers.</p>
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

  // Check if customer data is available
  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">No customer data available for editing.</p>
          <button
            onClick={() => navigate('/jkhm/seller/customers')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Edit Customer</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {customer.contacts?.[0]?.firstName} {customer.contacts?.[0]?.lastName}
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
                onClick={handleSubmit}
                disabled={saving}
                type='submit'
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <MdSave className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {saving ? 'Saving...' : 'Save Changes'}
                </span>
                <span className="sm:hidden">
                  {saving ? 'Saving...' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column - Basic Information */}
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
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
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

          {/* Right Column - Customer Summary */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Customer Summary Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MdPerson className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Customer Summary
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {customer.contacts?.[0]?.firstName} {customer.contacts?.[0]?.lastName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">ID: {customer.id?.slice(-6)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <MdCalendarToday className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {customer.orders && customer.orders.length > 0 && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <MdShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      <span>{customer.orders.length} orders</span>
                    </div>
                  )}
                  
                  {customer.orders && customer.orders.length > 0 && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <MdAttachMoney className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-green-600 font-medium">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(customer.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
              
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => navigate('/jkhm/place-order', { 
                    state: { 
                      selectedUser: {
                        id: customer.id,
                        firstName: customer.contacts?.[0]?.firstName,
                        lastName: customer.contacts?.[0]?.lastName,
                        phone: customer.contacts?.[0]?.phoneNumbers?.[0]?.number,
                        email: customer.auth?.email
                      }
                    } 
                  })}
                  className="w-full px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MdShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Book Now</span>
                  <span className="sm:hidden">Book Now</span>
                </button>
                
                <button
                  onClick={() => navigate('/jkhm/seller/customers')}
                  className="w-full px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MdArrowBack className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to List</span>
                  <span className="sm:hidden">Back to List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerPage;
