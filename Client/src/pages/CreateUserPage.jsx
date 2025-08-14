import React, { useState } from 'react';
import { FaUser, FaPhone, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import useAuthStore from '../stores/Zustand.store';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const { isSeller, createContact, loading, error } = useSeller();
  const { userId } = useAuthStore(); // Get current user ID
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }



    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isSeller) {
      alert('Only sellers can add contacts.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createContact(formData);
      
      // Store the created user data
      setCreatedUser(result.data);
      
      // Show success state
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: ''
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.message || 'Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not a seller, show unauthorized message
  if (!isSeller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unauthorized Access</h1>
          <p className="text-gray-400 mb-6">Only sellers can add contacts.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-2 mx-auto"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft size={16} />
            <span>Go Back</span>
          </motion.button>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <FaUser className="text-white text-3xl" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Add New Contact
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400"
          >
            Add a new contact with customer ID
          </motion.p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
        >
          {/* First Name Field */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
              <FaUser className="text-orange-400" />
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                errors.firstName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.firstName}
              </motion.p>
            )}
          </div>

          {/* Last Name Field */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
              <FaUser className="text-orange-400" />
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                errors.lastName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.lastName}
              </motion.p>
            )}
          </div>



          {/* Phone Number Field */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
              <FaPhone className="text-orange-400" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter phone number (e.g., +91 98765 43210)"
            />
            {errors.phoneNumber && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.phoneNumber}
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Adding Contact...</span>
              </div>
            ) : (
              <span>Add Contact</span>
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-gray-500 text-sm">
            By adding a contact, you agree to our{' '}
            <a href="/terms" className="text-orange-400 hover:text-orange-300 transition-colors">
              Terms of Service
            </a>
          </p>
        </motion.div>

        {/* Success Message */}
        {showSuccess && createdUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 p-6 bg-green-50 border border-green-200 rounded-2xl"
          >
            <div className="text-center">
              <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Contact Created Successfully!
              </h3>
              <p className="text-green-600 mb-4">
                <strong>{createdUser.contact.firstName} {createdUser.contact.lastName}</strong> has been added with Customer ID: <strong>{createdUser.user.customerId}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setCreatedUser(null);
                  }}
                  className="px-4 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Add Another Contact
                </button>
                <button
                  onClick={() => navigate('/jkhm/booking')}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Booking Page
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateUserPage;
