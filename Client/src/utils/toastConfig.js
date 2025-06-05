import { toast } from 'react-toastify';

// Check if device is mobile
const isMobile = () => window.innerWidth <= 768;

// Get responsive position
const getResponsivePosition = () => {
  return isMobile() ? "bottom-center" : "top-right";
};

// Default toast configuration
const defaultConfig = {
  position: getResponsivePosition(),
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  style: {
    width: isMobile() ? '90%' : 'auto',
    maxWidth: isMobile() ? '400px' : '500px',
    margin: isMobile() ? '0 auto' : '0',
    fontSize: isMobile() ? '14px' : '16px',
    padding: isMobile() ? '12px' : '16px',
  },
};

// Modern gradient style configuration
const modernConfig = {
  position: getResponsivePosition(),
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
  style: {
    background: "linear-gradient(to right, #4f46e5, #7c3aed)",
    color: "white",
    borderRadius: isMobile() ? "8px" : "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    width: isMobile() ? '90%' : 'auto',
    maxWidth: isMobile() ? '400px' : '500px',
    margin: isMobile() ? '0 auto' : '0',
    fontSize: isMobile() ? '14px' : '16px',
    padding: isMobile() ? '12px' : '16px',
  },
};

// Success toast configuration
const successConfig = {
  ...defaultConfig,
  autoClose: 3000,
};

// Modern success configuration
const modernSuccessConfig = {
  ...modernConfig,
  style: {
    ...modernConfig.style,
    background: "linear-gradient(to right, #059669, #10b981)",
  },
};

// Error toast configuration
const errorConfig = {
  ...defaultConfig,
  autoClose: 5000,
};

// Modern error configuration
const modernErrorConfig = {
  ...modernConfig,
  style: {
    ...modernConfig.style,
    background: "linear-gradient(to right, #dc2626, #ef4444)",
  },
};

// Warning toast configuration
const warningConfig = {
  ...defaultConfig,
  autoClose: 4000,
};

// Modern warning configuration
const modernWarningConfig = {
  ...modernConfig,
  style: {
    ...modernConfig.style,
    background: "linear-gradient(to right, #d97706, #f59e0b)",
  },
};

// Custom toast functions with responsive handling
export const showSuccessToast = (message) => {
  const config = {
    ...successConfig,
    position: getResponsivePosition(),
  };
  toast.success(message, config);
};

export const showErrorToast = (message) => {
  const config = {
    ...errorConfig,
    position: getResponsivePosition(),
  };
  toast.error(message, config);
};

export const showInfoToast = (message) => {
  const config = {
    ...defaultConfig,
    position: getResponsivePosition(),
  };
  toast.info(message, config);
};

export const showWarningToast = (message) => {
  const config = {
    ...warningConfig,
    position: getResponsivePosition(),
  };
  toast.warning(message, config);
};

// Modern style toast functions with responsive handling
export const showModernSuccessToast = (message) => {
  const config = {
    ...modernSuccessConfig,
    position: getResponsivePosition(),
  };
  toast.success(message, config);
};

export const showModernErrorToast = (message) => {
  const config = {
    ...modernErrorConfig,
    position: getResponsivePosition(),
  };
  toast.error(message, config);
};

export const showModernInfoToast = (message) => {
  const config = {
    ...modernConfig,
    position: getResponsivePosition(),
  };
  toast.info(message, config);
};

export const showModernWarningToast = (message) => {
  const config = {
    ...modernWarningConfig,
    position: getResponsivePosition(),
  };
  toast.warning(message, config);
};

// Registration specific toasts
export const showRegistrationSuccess = () => {
  showModernSuccessToast('Registration successful! Redirecting to login...');
};

export const showRegistrationError = (error) => {
  if (error.response?.data?.errors) {
    showModernErrorToast('Registration failed. Please check the form for errors.');
  } else {
    showModernErrorToast('Registration failed. Please try again.');
  }
};

// Login specific toasts
export const showLoginSuccess = () => {
  showSuccessToast('Login successful! Redirecting...');
};

export const showLoginError = (error) => {
  const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
  showErrorToast(message);
};

// Export default configs for direct use
export const toastConfigs = {
  default: defaultConfig,
  success: successConfig,
  error: errorConfig,
  warning: warningConfig,
  modern: modernConfig,
  modernSuccess: modernSuccessConfig,
  modernError: modernErrorConfig,
  modernWarning: modernWarningConfig,
}; 