const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Auth, User, Company, Session } = require('../models');
const AuthService = require('../services/auth.service');
const { generateTokens, verifyRefreshToken } = require('../config/jwt.config');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';

// Helper function to generate token
const generateToken = (user, auth) => {
  return jwt.sign(
    {
      userId: user.id,
      email: auth.email,
      companyId: user.company_id
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Helper function to set tokens in cookies
const setTokensInCookies = (res, accessToken, refreshToken) => {
  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Helper function to clear tokens from cookies
const clearTokensFromCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingAuth = await Auth.findOne({
      where: { email }
    });

    if (existingAuth) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create auth record first
    const auth = await Auth.create({
      email,
      password: hashedPassword,
      phone_number: phone,
      status: 'active'
    });


    // Create user record
    const user = await User.create({
      name,
      auth_id: auth.id,
      role_id: 2, // Assuming 2 is for regular users
      status: 'active'
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set tokens in cookies
    setTokensInCookies(res, accessToken, refreshToken);

    // Send response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: auth.email,
          role: user.role_id
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find auth record by email
    const auth = await Auth.findOne({
      where: { email },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!auth || !auth.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, auth.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(auth.user);

    // Set tokens in cookies
    setTokensInCookies(res, accessToken, refreshToken);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: auth.user.id,
          name: auth.user.name,
          email: auth.email,
          role: auth.user.role_id
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Auth,
        as: 'auth'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set new tokens in cookies
    setTokensInCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.auth.email,
          role: user.role_id
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

const logout = async (req, res) => {
  try {
    clearTokensFromCookies(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
}; 