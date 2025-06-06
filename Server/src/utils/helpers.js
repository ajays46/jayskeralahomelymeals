const crypto = require('crypto');

// Generate a secure API key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format (basic validation)
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

module.exports = {
  generateApiKey,
  isValidEmail,
  isValidPhoneNumber,
  isStrongPassword
}; 