import crypto from 'crypto';

// Generate a secure API key
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format (basic validation)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Validate password strength
export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Generate a short token for customer portal access (8-10 characters)
export const generateShortToken = () => {
  // Generate 6 random bytes and convert to URL-safe base64
  // This gives us ~8 characters (6 bytes * 4/3 = 8 chars in base64)
  const randomBytes = crypto.randomBytes(6);
  // Use base64url encoding (URL-safe, no padding)
  return randomBytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 8); // Ensure exactly 8 characters
}; 