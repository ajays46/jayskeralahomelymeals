import { toast } from 'react-toastify';

// Toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Custom toast functions
export const showSuccessToast = (message) => {
  toast.success(message, toastConfig);
};

export const showErrorToast = (message) => {
  toast.error(message, toastConfig);
};

export const showWarningToast = (message) => {
  toast.warning(message, toastConfig);
};

export const showInfoToast = (message) => {
  toast.info(message, toastConfig);
};

// Login specific error function
export const showLoginError = (error) => {
  const errorMessage = error.response?.data?.message || 'An error occurred during login.';
  toast.error(errorMessage, toastConfig);
};

// Login success function
export const showLoginSuccess = () => {
  toast.success('Login successful!', toastConfig);
};

// Registration specific functions
export const showRegistrationError = (error) => {
  const errorMessage = error.response?.data?.message || 'An error occurred during registration.';
  toast.error(errorMessage, toastConfig);
};

export const showRegistrationSuccess = () => {
  toast.success('Registration successful! Please check your email for verification.', toastConfig);
};

export default toastConfig;
