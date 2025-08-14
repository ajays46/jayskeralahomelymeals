import React from 'react';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showOrderSuccess,
  showOrderError,
  showPaymentSuccess,
  showPaymentError,
  showAddressSuccess,
  showAddressError,
  showMenuSuccess,
  showMenuError,
  showProductSuccess,
  showProductError,
  showUserSuccess,
  showUserError,
  showUserCreated,
  showUploadSuccess,
  showUploadError,
  showFileTooLarge,
  showValidationError,
  showRequiredFieldError,
  showNetworkError,
  showApiError,
  showCopiedToClipboard,
  showSaved,
  showDeleted,
  showUpdated,
  showProcessing,
  updateProcessingToast,
  dismissAllToasts
} from '../utils/toastConfig.jsx';

const ToastDemo = () => {
  const handleSuccessToasts = () => {
    showSuccessToast('This is a success message!', 'Success!');
    showOrderSuccess('Order placed successfully!');
    showPaymentSuccess('Payment processed!');
    showAddressSuccess('Address saved!');
    showMenuSuccess('Menu updated!');
    showProductSuccess('Product saved!');
    showUserSuccess('User updated!');
    showUserCreated('New user created!');
    showUploadSuccess('File uploaded!');
    showSaved('Your changes');
    showUpdated('User profile');
    showDeleted('Selected item');
  };

  const handleErrorToasts = () => {
    showErrorToast('This is an error message!', 'Error!');
    showOrderError('Failed to create order');
    showPaymentError('Payment failed');
    showAddressError('Failed to save address');
    showMenuError('Failed to update menu');
    showProductError('Failed to save product');
    showUserError('Failed to update user');
    showUploadError('File upload failed');
    showNetworkError('Connection lost');
    showApiError({ response: { data: { message: 'API request failed' } } });
  };

  const handleWarningToasts = () => {
    showWarningToast('This is a warning message!', 'Warning!');
    showFileTooLarge('10MB');
    showValidationError('Please check your input');
    showRequiredFieldError('Email address');
  };

  const handleInfoToasts = () => {
    showInfoToast('This is an info message!', 'Information');
    showCopiedToClipboard('Text');
  };

  const handleProcessingToast = () => {
    const toastId = showProcessing('Processing your request...');
    
    // Simulate processing
    setTimeout(() => {
      updateProcessingToast(toastId, 'Request completed successfully!', 'success');
    }, 2000);
  };

  const handleDismissAll = () => {
    dismissAllToasts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🎉 Toast Notification Demo
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Success Toasts */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Success Toasts
              </h3>
              <button
                onClick={handleSuccessToasts}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Show All Success Toasts
              </button>
            </div>

            {/* Error Toasts */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">❌</span>
                Error Toasts
              </h3>
              <button
                onClick={handleErrorToasts}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Show All Error Toasts
              </button>
            </div>

            {/* Warning Toasts */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Warning Toasts
              </h3>
              <button
                onClick={handleWarningToasts}
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Show All Warning Toasts
              </button>
            </div>

            {/* Info Toasts */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span>
                Info Toasts
              </h3>
              <button
                onClick={handleInfoToasts}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Show All Info Toasts
              </button>
            </div>

            {/* Processing Toast */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                Processing Toast
              </h3>
              <button
                onClick={handleProcessingToast}
                className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Show Processing Toast
              </button>
            </div>

            {/* Dismiss All */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🗑️</span>
                Clear All
              </h3>
              <button
                onClick={handleDismissAll}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Dismiss All Toasts
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 How to Use</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Import:</strong> <code>import { '{ showSuccessToast, showErrorToast }' } from '../utils/toastConfig.jsx';</code></p>
              <p><strong>Basic Usage:</strong> <code>showSuccessToast('Your message', 'Optional Title');</code></p>
              <p><strong>Specific Toasts:</strong> <code>showOrderSuccess('Order created!');</code></p>
              <p><strong>Error Handling:</strong> <code>showApiError(error);</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
