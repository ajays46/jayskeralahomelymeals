import { registerUser, loginUser } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';

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
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.status(200).json({
      success: true,    
      message: 'Login successful',
      data: result
    });
  } catch (error) {
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
