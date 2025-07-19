import { registerUser, loginUser, forgotPasswordService, resetPasswordService, adminLoginService } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.config.js';
import prisma from '../config/prisma.js';
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

export const adminLogin = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const admin = await adminLoginService(userId);
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      user: admin,
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userRole: true
        }
      });

      if (!user) {
        throw new AppError("Invalid refresh token", 401);
      }

      if (!user.userRole) {
        throw new AppError("User role not found", 403);
      }

      const newAccessToken = generateAccessToken(user.id, user.userRole.name);
      const newRefreshToken = generateRefreshToken(user.id, user.userRole.name);

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
    const users = await prisma.user.findMany({
      include: {
        auth: true,
        userRole: true
      }
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    const result = await forgotPasswordService(identifier);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword } = req.body;
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
