import { toast } from 'sonner';
import { PASSWORD_POLICY_MESSAGE } from '../validations/registerValidation';

/**
 * Toast Configuration - Centralized toast notification system
 * Provides consistent styling and behavior for all user notifications
 * Features: Success, error, warning, info toasts with custom styling and timing
 */

// Enhanced Toast configuration
export const toastConfig = {
  position: 'top-right',
  duration: 4000,
};

const normalizePasswordErrorMessage = (message) => {
  const text = String(message || '').trim();
  if (!text) return '';
  if (/passwords?\s+must\s+be\s+at\s+least\s+6/i.test(text) || /at\s+least\s+6\s+characters/i.test(text)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  return text;
};

// Enhanced toast functions with better styling and messages
export const showSuccessToast = (message, title = "Success!") => {
  toast.success(title, {
    ...toastConfig,
    description: message,
  });
};

export const showErrorToast = (message, title = "Error!") => {
  const normalizedMessage = normalizePasswordErrorMessage(message);
  toast.error(title, {
    ...toastConfig,
    description: normalizedMessage || 'Something went wrong. Please try again.',
    duration: 5000,
  });
};

export const showWarningToast = (message, title = "Warning!") => {
  toast.warning(title, {
    ...toastConfig,
    description: message,
  });
};

export const showInfoToast = (message, title = "Info") => {
  toast.info(title, {
    ...toastConfig,
    description: message,
  });
};

// Authentication specific toasts
export const showLoginError = (error) => {
  const errorMessage = error.response?.data?.message || 'An error occurred during sign in.';
  showErrorToast(errorMessage, "Sign In Failed");
};

export const showLoginSuccess = () => {
  showSuccessToast('Welcome back! You have been successfully signed in.', "Sign In Successful");
};

export const showLogoutSuccess = () => {
  showSuccessToast('You have been successfully logged out.', "Logout Successful");
};

export const showRegistrationError = (error) => {
  const errorMessage = error.response?.data?.message || 'An error occurred during registration.';
  showErrorToast(errorMessage, "Registration Failed");
};

export const showRegistrationSuccess = () => {
  showSuccessToast('Account created successfully! Please check your email for verification.', "Registration Successful");
};

// Order and payment specific toasts
export const showOrderSuccess = (message = "Order created successfully!") => {
  showSuccessToast(message, "Order Successful");
};

export const showOrderError = (message = "We couldn't create your order. Please try again.") => {
  showErrorToast(message, "Order failed");
};

export const showPaymentSuccess = (message = "Payment processed successfully!") => {
  showSuccessToast(message, "Payment Successful");
};

export const showPaymentError = (message = "Payment failed") => {
  showErrorToast(message, "Payment Failed");
};

// Address and location specific toasts
export const showAddressSuccess = (message = "Address saved successfully!") => {
  showSuccessToast(message, "Address Saved");
};

export const showAddressError = (message = "We couldn't save the address. Please try again.") => {
  showErrorToast(message, "Address could not be saved");
};

// Menu and product specific toasts
export const showMenuSuccess = (message = "Menu updated successfully!") => {
  showSuccessToast(message, "Menu Updated");
};

export const showMenuError = (message = "Failed to update menu") => {
  showErrorToast(message, "Menu Error");
};

export const showProductSuccess = (message = "Product saved successfully!") => {
  showSuccessToast(message, "Product Saved");
};

export const showProductError = (message = "Failed to save product") => {
  showErrorToast(message, "Product Error");
};

// User management specific toasts
export const showUserSuccess = (message = "User updated successfully!") => {
  showSuccessToast(message, "User Updated");
};

export const showUserError = (message = "Failed to update user") => {
  showErrorToast(message, "User Error");
};

export const showUserCreated = (message = "User created successfully!") => {
  showSuccessToast(message, "User Created");
};

// File upload specific toasts
export const showUploadSuccess = (message = "File uploaded successfully!") => {
  showSuccessToast(message, "Upload Successful");
};

export const showUploadError = (message = "We couldn't upload the file. Please try again.") => {
  showErrorToast(message, "Upload failed");
};

export const showFileTooLarge = (maxSize = "5MB") => {
  showWarningToast(`File size exceeds the maximum limit of ${maxSize}`, "File Too Large");
};

// Validation specific toasts
export const showValidationError = (message = "Please check your input and try again.") => {
  showWarningToast(message, "Please check your details");
};

export const showRequiredFieldError = (fieldName) => {
  showWarningToast(`${fieldName} is required`, "Required Field");
};

// Network and API specific toasts
export const showNetworkError = (message = "Please check your internet connection and try again.") => {
  showErrorToast(message, "Connection Problem");
};

export const showApiError = (error) => {
  const message = error.response?.data?.message || 'Something went wrong. Please try again.';
  showErrorToast(message, "Something went wrong");
};

// Success actions
export const showCopiedToClipboard = (item = "text") => {
  showSuccessToast(`${item} copied to clipboard!`, "Copied!");
};

export const showSaved = (item = "changes") => {
  showSuccessToast(`${item} saved successfully!`, "Saved!");
};

export const showDeleted = (item = "item") => {
  showSuccessToast(`${item} deleted successfully!`, "Deleted!");
};

export const showUpdated = (item = "item") => {
  showSuccessToast(`${item} updated successfully!`, "Updated!");
};

// Loading and processing toasts
export const showProcessing = (message = "Processing your request...") => {
  return toast.loading('Please wait', {
    ...toastConfig,
    description: message,
    duration: Infinity,
  });
};

export const updateProcessingToast = (toastId, message, type = "success") => {
  const normalizedType = String(type || 'success').toLowerCase();
  if (normalizedType === 'error') {
    toast.error('Error', { ...toastConfig, id: toastId, description: message, duration: 5000 });
    return;
  }
  if (normalizedType === 'warning') {
    toast.warning('Notice', { ...toastConfig, id: toastId, description: message, duration: 4000 });
    return;
  }
  if (normalizedType === 'info') {
    toast.info('Info', { ...toastConfig, id: toastId, description: message, duration: 4000 });
    return;
  }
  toast.success('Done', { ...toastConfig, id: toastId, description: message, duration: 3000 });
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Dismiss specific toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export default toastConfig;
