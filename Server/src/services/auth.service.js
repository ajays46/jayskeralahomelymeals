
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Auth = require('../models/auth');
const AppError = require('../utils/AppError');
const { generateApiKey } = require('../utils/helpers');

exports.registerUser = async ({ email, password, phone }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const existingAuth = await Auth.findOne({ where: { email } });
  if (existingAuth) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const api_key = generateApiKey();

  try {
    const auth = await Auth.create({
      email,
      password: hashedPassword,
      phone_number: phone,
      api_key,
      status: 'active'
    });

    return {
      id: auth.id,
      email: auth.email,
      phone_number: auth.phone_number,
      api_key: auth.api_key,
      status: auth.status
    };
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      throw new AppError('Validation error: ' + err.message, 400);
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Email or API key already exists', 409);
    }
    throw new AppError('Database error occurred', 500);
  }
};

exports.loginUser = async ({ email, password }) => {
  const auth = await Auth.findOne({ where: { email } });

  if (!auth || !(await bcrypt.compare(password, auth.password))) {
    throw new AppError('Invalid credentials', 401);
  }

  if (auth.status !== 'active') {
    throw new AppError('Account is not active', 403);
  }

  const accessToken = jwt.sign(
    { id: auth.id, email: auth.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1m' }
  );

  const refreshToken = jwt.sign(
    { id: auth.id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: auth.id,
      email: auth.email,
      phone: auth.phone_number,
      api_key: auth.api_key,
      status: auth.status
    },
    tokens: { accessToken, refreshToken }
  };
};

exports.refreshAuthToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token is required', 400);

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
  );

  const auth = await Auth.findByPk(decoded.id);
  if (!auth) throw new AppError('User not found', 404);
  if (auth.status !== 'active') throw new AppError('Account is not active', 403);

  const newAccessToken = jwt.sign(
    { id: auth.id, email: auth.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );

  const newRefreshToken = jwt.sign(
    { id: auth.id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
