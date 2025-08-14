import { toast } from 'react-toastify';

// Enhanced Toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  newestOnTop: true,
  rtl: false,
  pauseOnFocusLoss: true,
};

// Enhanced toast functions with better styling and messages
export const showSuccessToast = (message, title = "Success!") => {
  toast.success(
    <div>
      <div className="font-semibold text-green-800">{title}</div>
      <div className="text-green-700">{message}</div>
    </div>,
    {
      ...toastConfig,
      icon: "✅",
      className: "bg-green-50 border border-green-200",
    }
  );
};

export const showErrorToast = (message, title = "Error!") => {
  toast.error(
    <div>
      <div className="font-semibold text-red-800">{title}</div>
      <div className="text-red-700">{message}</div>
    </div>,
    {
      ...toastConfig,
      icon: "❌",
      className: "bg-red-50 border border-red-200",
      autoClose: 5000, // Keep error messages longer
    }
  );
};

export const showWarningToast = (message, title = "Warning!") => {
  toast.warning(
    <div>
      <div className="font-semibold text-yellow-800">{title}</div>
      <div className="text-yellow-700">{message}</div>
    </div>,
    {
      ...toastConfig,
      icon: "⚠️",
      className: "bg-yellow-50 border border-yellow-200",
    }
  );
};

export const showInfoToast = (message, title = "Info") => {
  toast.info(
    <div>
      <div className="font-semibold text-blue-800">{title}</div>
      <div className="text-blue-700">{message}</div>
    </div>,
    {
      ...toastConfig,
      icon: "ℹ️",
      className: "bg-blue-50 border border-blue-200",
    }
  );
};

// Authentication specific toasts
export const showLoginError = (error) => {
  const errorMessage = error.response?.data?.message || 'An error occurred during login.';
  showErrorToast(errorMessage, "Login Failed");
};

export const showLoginSuccess = () => {
  showSuccessToast('Welcome back! You have been successfully logged in.', "Login Successful");
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

export const showOrderError = (message = "Failed to create order") => {
  showErrorToast(message, "Order Failed");
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

export const showAddressError = (message = "Failed to save address") => {
  showErrorToast(message, "Address Error");
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

export const showUploadError = (message = "File upload failed") => {
  showErrorToast(message, "Upload Failed");
};

export const showFileTooLarge = (maxSize = "5MB") => {
  showWarningToast(`File size exceeds the maximum limit of ${maxSize}`, "File Too Large");
};

// Validation specific toasts
export const showValidationError = (message = "Please check your input and try again") => {
  showWarningToast(message, "Validation Error");
};

export const showRequiredFieldError = (fieldName) => {
  showWarningToast(`${fieldName} is required`, "Required Field");
};

// Network and API specific toasts
export const showNetworkError = (message = "Network error. Please check your connection") => {
  showErrorToast(message, "Network Error");
};

export const showApiError = (error) => {
  const message = error.response?.data?.message || 'An unexpected error occurred';
  showErrorToast(message, "API Error");
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
  return toast.loading(message, {
    ...toastConfig,
    autoClose: false,
    closeButton: false,
  });
};

export const updateProcessingToast = (toastId, message, type = "success") => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 3000,
    closeButton: true,
  });
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
