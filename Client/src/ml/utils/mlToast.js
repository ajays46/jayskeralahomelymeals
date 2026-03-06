/**
 * ML Toast - Ant Design notification popups styled for mobile app.
 * Use in ML (MaXHub Logistics) pages for success/error feedback.
 */
import { notification } from 'antd';

const NOTIFICATION_KEY = 'ml-toast';
const DURATION_SUCCESS = 3;
const DURATION_ERROR = 4;

// Configure for mobile-style: top center, single notification, safe area
if (typeof window !== 'undefined') {
  notification.config({
    placement: 'top',
    top: 16,
    maxCount: 1,
    getContainer: () => document.body,
  });
}

const baseOptions = {
  key: NOTIFICATION_KEY,
  placement: 'top',
  duration: DURATION_SUCCESS,
  className: 'ml-mobile-notification',
  closeIcon: null,
};

/**
 * Show success popup (mobile-style).
 * @param {string} message - Main message text
 * @param {string} [title='Success'] - Short title
 */
export const showSuccessToast = (message, title = 'Success') => {
  notification.success({
    ...baseOptions,
    message: title,
    description: message,
    duration: DURATION_SUCCESS,
    className: 'ml-mobile-notification ml-mobile-notification-success',
  });
};

/**
 * Show error popup (mobile-style).
 * @param {string} message - Main message text
 * @param {string} [title='Error'] - Short title
 */
export const showErrorToast = (message, title = 'Error') => {
  notification.error({
    ...baseOptions,
    message: title,
    description: message,
    duration: DURATION_ERROR,
    className: 'ml-mobile-notification ml-mobile-notification-error',
  });
};

/**
 * Show warning popup (mobile-style).
 */
export const showWarningToast = (message, title = 'Warning') => {
  notification.warning({
    ...baseOptions,
    message: title,
    description: message,
    duration: DURATION_SUCCESS,
    className: 'ml-mobile-notification ml-mobile-notification-warning',
  });
};

/**
 * Show info popup (mobile-style).
 */
export const showInfoToast = (message, title = 'Info') => {
  notification.info({
    ...baseOptions,
    message: title,
    description: message,
    duration: DURATION_SUCCESS,
    className: 'ml-mobile-notification ml-mobile-notification-info',
  });
};

export default { showSuccessToast, showErrorToast, showWarningToast, showInfoToast };
