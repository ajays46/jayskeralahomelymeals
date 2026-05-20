import { registerUser, loginUser, loginWithGoogle, forgotPasswordService, resetPasswordService, adminLoginService, addUserRole, removeUserRole, getUserRoles, hasRole, completeGoogleUserProfile, setupGoogleAccount } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken, REFRESH_REMEMBER_COOKIE_MAX_MS } from '../utils/jwt.config.js';
import { clearJWTCookie, setJWTCookie } from '../utils/cookieUtils.js';
import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy.js';
import { logSecurityEvent } from '../middleware/logging.middleware.js';
import { createTextCaptcha } from '../utils/textCaptcha.js';
import { verifyCaptchaChallenge } from '../utils/captchaVerification.js';

dotenv.config();

/**
 * Auth Controller - Handles user authentication and authorization operations
 * Features: User registration, login, password reset, role management, JWT token handling
 */

export const getCaptcha = async (req, res, next) => {
  try {
    const purpose = String(req.query?.purpose || 'register').toLowerCase().trim();
    const allowedPurposes = new Set(['register', 'login', 'change-password']);
    const normalizedPurpose = allowedPurposes.has(purpose) ? purpose : 'register';
    const captcha = createTextCaptcha(normalizedPurpose);

    res.status(200).json({
      success: true,
      data: captcha
    });
  } catch (error) {
    next(error);
  }
};

// Register new user (companyPath from frontend for per-company phone uniqueness)
export const register = async (req, res, next) => {
  try {
    const { email, identifier, password, phone, companyPath, termsAccepted, captchaToken, captchaProvider, captchaAction, captchaId, captchaText } = req.body;

    const user = await registerUser({
      email,
      identifier,
      password,
      phone,
      companyPath,
      termsAccepted,
      captchaToken,
      captchaProvider,
      captchaAction,
      captchaId,
      captchaText,
      remoteIp: req.ip || req.connection?.remoteAddress
    });
    res.status(201).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Login user (companyPath from frontend for phone login when same phone in multiple companies)
export const login = async (req, res, next) => {
  try {
    const { identifier, password, companyPath, remember, captchaToken, captchaProvider, captchaAction, captchaId, captchaText } = req.body;
    const rememberMe = remember === true || remember === 'true';
    const userData = await loginUser({
      identifier,
      password,
      companyPath,
      remember: rememberMe,
      captchaToken,
      captchaProvider,
      captchaAction,
      captchaId,
      captchaText,
      remoteIp: req.ip || req.connection?.remoteAddress
    });

    const { accessToken, refreshToken } = userData.token;

    setJWTCookie(res, refreshToken, 'jwt', rememberMe ? REFRESH_REMEMBER_COOKIE_MAX_MS : undefined);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      data: userData.user
    });

  } catch (error) {
    logSecurityEvent('login_failure', null, req.ip || req.connection?.remoteAddress, {
      identifier: req.body?.identifier,
      reason: error.message
    });
    next(error);
  }
};

// Login/register user with Google credential token
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, companyPath, remember } = req.body;
    const rememberMe = remember === true || remember === 'true';
    const userData = await loginWithGoogle({ credential, companyPath, remember: rememberMe });
    const { accessToken, refreshToken } = userData.token;

    setJWTCookie(res, refreshToken, 'jwt', rememberMe ? REFRESH_REMEMBER_COOKIE_MAX_MS : undefined);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      accessToken,
      data: userData.user
    });
  } catch (error) {
    next(error);
  }
};

export const completeGoogleProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { phone, termsAccepted } = req.body || {};
    const updatedUser = await completeGoogleUserProfile({ userId, phone, termsAccepted });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const setupGoogleAccountController = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { phone, termsAccepted, newPassword } = req.body || {};
    const updatedUser = await setupGoogleAccount({ userId, phone, termsAccepted, newPassword });

    res.status(200).json({
      success: true,
      message: 'Account setup completed successfully',
      data: updatedUser
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
      logSecurityEvent('refresh_token_missing', null, req.ip || req.connection?.remoteAddress, {});
      throw new AppError("No refresh token provided", 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userRoles: true
        }
      });

      if (!user) {
        throw new AppError("Invalid refresh token", 401);
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError("Your account is inactive. Please contact your administrator.", 403);
      }

      if (!user.userRoles || user.userRoles.length === 0) {
        throw new AppError("User roles not found", 403);
      }

      // Get all roles as comma-separated string for JWT token
      const allRoles = user.userRoles.map(role => role.name).join(',');
      // Get the primary role (first role or highest priority role)
      const primaryRole = user.userRoles[0];
      const newAccessToken = generateAccessToken(user.id, allRoles);
      /** Legacy tokens omit `rm`; treat as persistent so existing users keep long-lived refresh. */
      const persistent = decoded.rm !== 0;
      const newRefreshToken = generateRefreshToken(user.id, allRoles, persistent);

      setJWTCookie(res, newRefreshToken, 'jwt', persistent ? REFRESH_REMEMBER_COOKIE_MAX_MS : undefined);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });

    } catch (jwtError) {
      logSecurityEvent('refresh_token_invalid', null, req.ip || req.connection?.remoteAddress, {
        reason: jwtError.message,
        name: jwtError.name
      });
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
        userRoles: true
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
  try {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    logSecurityEvent('logout', userId, req.ip || req.connection?.remoteAddress, {});
    clearJWTCookie(res);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// Add role to user
export const addRoleToUser = async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      throw new AppError('User ID and role name are required', 400);
    }

    const userRole = await addUserRole(userId, roleName);
    
    res.status(201).json({
      success: true,
      message: 'Role added successfully',
      data: userRole
    });
  } catch (error) {
    next(error);
  }
};

// Remove role from user
export const removeRoleFromUser = async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      throw new AppError('User ID and role name are required', 400);
    }

    const result = await removeUserRole(userId, roleName);
    
    res.status(200).json({
      success: true,
      message: 'Role removed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get user roles
export const getUserRolesController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const roles = await getUserRoles(userId);
    
    res.status(200).json({
      success: true,
      data: { userId, roles }
    });
  } catch (error) {
    next(error);
  }
};

// Check if user has role
export const checkUserRole = async (req, res, next) => {
  try {
    const { userId, roleName } = req.params;

    if (!userId || !roleName) {
      throw new AppError('User ID and role name are required', 400);
    }

    const hasUserRole = await hasRole(userId, roleName);
    
    res.status(200).json({
      success: true,
      data: { userId, roleName, hasRole: hasUserRole }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, captchaToken, captchaId, captchaText } = req.body;
    const userId = req.user.userId; // Get user ID from JWT token

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    const captchaCheck = await verifyCaptchaChallenge({
      captchaToken,
      captchaId,
      captchaText,
      purpose: 'change-password',
      remoteIp: req.ip || req.connection?.remoteAddress
    });
    if (!captchaCheck.success) {
      throw new AppError('Please complete CAPTCHA verification', 400);
    }
    if (!isStrongPassword(newPassword)) {
      throw new AppError(PASSWORD_POLICY_MESSAGE, 400);
    }

    // Find user with auth details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { auth: true }
    });

    if (!user || !user.auth) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.auth.password);
    
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.auth.update({
      where: { id: user.auth.id },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
