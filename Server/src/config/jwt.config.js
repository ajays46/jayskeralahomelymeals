const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  }
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_CONFIG.access.secret,
    { expiresIn: JWT_CONFIG.access.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_CONFIG.refresh.secret,
    { expiresIn: JWT_CONFIG.refresh.expiresIn }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.access.secret);
  } catch (error) {
    throw error;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.refresh.secret);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  JWT_CONFIG,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken
}; 