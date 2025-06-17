import { registerUser, loginUser,  forgotPasswordService, resetPasswordService } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.config.js';
import Auth from '../models/auth.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

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
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/', // important
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(accessToken, "accessToken");
    console.log(refreshToken, "refreshToken");
    

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
    const token = req.cookies.jwt;
    
    if (!token) {
      throw new AppError("No refresh token provided", 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new AppError("Invalid refresh token", 401);
      }

      const newAccessToken = generateAccessToken(user.id, user.role);
      const newRefreshToken = generateRefreshToken(user.id, user.role);

      res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError("Refresh token expired", 401);
      }
      throw new AppError("Invalid refresh token", 401);
    }

  } catch (error) {
    next(error);
  }
};

export const usersList = async (req, res, next) => {
  try {
    const users = await User.findAll();
    // console.log(users);
    
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    console.log(identifier, "identifier");
    
    const result = await forgotPasswordService(identifier);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword} = req.body;
    console.log(token, id, newPassword, "token, id, newPassword");
    const result = await resetPasswordService(token, id, newPassword);
    res.status(200).json(result);
  } catch (error) { 
    next(error);  
  }
};

// Logout user
export const logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
