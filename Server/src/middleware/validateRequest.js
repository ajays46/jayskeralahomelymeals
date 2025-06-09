const AppError = require('../utils/AppError');
const { isValidEmail, isValidPhoneNumber, isStrongPassword } = require('../utils/helpers');

const validateRegistration = (req, res, next) => {
  const { email, password, phone_number } = req.body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  // Validate password
  if (!password || !isStrongPassword(password)) {
    throw new AppError(
      'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
      400
    );
  }

  // Validate phone number
  if (phone_number && !isValidPhoneNumber(phone_number)) {
    throw new AppError('Invalid phone number format', 400);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  next();
};



module.exports = {
  validateRegistration,
  validateLogin,
  validateRefreshToken
}; 