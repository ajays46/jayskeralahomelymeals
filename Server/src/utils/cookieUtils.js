/**
 * Utility functions for cookie management
 */

/**
 * Clear JWT cookie with proper options
 * @param {Object} res - Express response object
 * @param {string} cookieName - Name of the cookie to clear (default: 'jwt')
 */
export const clearJWTCookie = (res, cookieName = 'jwt') => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 0 // Set to 0 to expire immediately
  };

  // Clear the cookie with the same options used when setting it
  res.clearCookie(cookieName, cookieOptions);
  
  // Also try to clear with different domain options in case the cookie was set differently
  res.clearCookie(cookieName, {
    ...cookieOptions,
    domain: undefined // Clear without domain restriction
  });
  
  // Try clearing with different path options
  res.clearCookie(cookieName, {
    ...cookieOptions,
    path: '/',
    domain: undefined
  });
};

/**
 * Set JWT cookie with proper options
 * @param {Object} res - Express response object
 * @param {string} token - JWT token to set
 * @param {string} cookieName - Name of the cookie (default: 'jwt')
 * @param {number} maxAge - Max age in milliseconds (default: 7 days)
 */
export const setJWTCookie = (res, token, cookieName = 'jwt', maxAge = 7 * 24 * 60 * 60 * 1000) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: maxAge
  };

  res.cookie(cookieName, token, cookieOptions);
};

/**
 * Get cookie value from request
 * @param {Object} req - Express request object
 * @param {string} cookieName - Name of the cookie to get
 * @returns {string|undefined} - Cookie value or undefined if not found
 */
export const getCookie = (req, cookieName) => {
  return req.cookies[cookieName];
};

/**
 * Check if a cookie exists
 * @param {Object} req - Express request object
 * @param {string} cookieName - Name of the cookie to check
 * @returns {boolean} - True if cookie exists
 */
export const hasCookie = (req, cookieName) => {
  return !!req.cookies[cookieName];
};
