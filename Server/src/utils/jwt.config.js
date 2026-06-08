import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


export const generateAccessToken = (userId,role) => {
    return jwt.sign({ userId,role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

/** Long-lived refresh when “Remember me” is checked (align cookie maxAge with this). */
export const JWT_REFRESH_REMEMBER_EXPIRES_IN =
    process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN || '30d';

/** Shorter refresh when session-only login (browser session cookie). */
export const JWT_REFRESH_SESSION_EXPIRES_IN =
    process.env.JWT_REFRESH_SESSION_EXPIRES_IN || '1d';

/** Milliseconds for HttpOnly refresh cookie when Remember me is true (default matches 30d). */
export const REFRESH_REMEMBER_COOKIE_MAX_MS =
    Number(process.env.JWT_REFRESH_REMEMBER_COOKIE_MS) || 30 * 24 * 60 * 60 * 1000;

/**
 * @param {boolean} remember - true: long JWT + persistent cookie; false: shorter JWT + session cookie
 */
export const generateRefreshToken = (userId, role, remember = false) => {
    const expiresIn = remember ? JWT_REFRESH_REMEMBER_EXPIRES_IN : JWT_REFRESH_SESSION_EXPIRES_IN;
    return jwt.sign(
        { userId, role, rm: remember ? 1 : 0 },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn }
    );
};

// Generate customer access token for read-only portal access (24 hour expiration)
export const generateCustomerAccessToken = (userId) => {
    return jwt.sign({ 
        userId, 
        type: 'CUSTOMER_ACCESS',
        permissions: ['READ_ORDERS', 'VIEW_STATUS']
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: '24h' });
}