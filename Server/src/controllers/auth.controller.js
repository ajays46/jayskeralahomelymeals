
const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const userData = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: {
        auth: userData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);

    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600000 // 7 days in milliseconds
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const tokens = await authService.refreshAuthToken(refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600000 // 7 days in milliseconds
    });

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {    
    next(error);
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    await authService.logoutUser();

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
