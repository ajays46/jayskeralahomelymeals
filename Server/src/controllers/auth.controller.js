import { registerUser, loginUser } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.config.js';
import Auth from '../models/auth.js';

dotenv.config();

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, phone } = req.body;
    const user = await registerUser({ email, password, phone });
    res.status(201).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const userData = await loginUser({ identifier, password });

    const { accessToken, refreshToken } = userData.token;

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // important
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      data: userData.user
    });

  } catch (error) {
    next(error);
  }
};



export const refreshToken = async (req, res, next) => {
  try {
      // ADDED DEBUGGING
      console.log('All cookies:', req.cookies);
      const token = req.cookies.jwt;
      console.log('Refresh token from cookie:', token);
      
      if (!token) {
          console.log('No refresh token found in cookies');
          throw new AppError("No refresh token provided", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      console.log('Decoded token:', decoded);

      const auth = await Auth.findByPk(decoded.authId);
      console.log('Found auth:', auth ? 'Yes' : 'No');
      
      if (!auth) throw new AppError("Invalid refresh token", 401);

      const newAccessToken = generateAccessToken(auth.id);
      const newRefreshToken = generateRefreshToken(auth.id);

      // Update cookie with new refresh token
      res.cookie('jwt', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          accessToken: newAccessToken,
      });

  } catch (error) {
      console.error('Refresh token error:', error);
      next(error);
  }
};




// Logout user
export const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
