import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


export const generateAccessToken = (userId,role) => {
    return jwt.sign({ userId,role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

export const generateRefreshToken = (userId,role) => {
    return jwt.sign({ userId,role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Generate customer access token for read-only portal access
export const generateCustomerAccessToken = (userId) => {
    return jwt.sign({ 
        userId, 
        type: 'CUSTOMER_ACCESS',
        permissions: ['READ_ORDERS', 'VIEW_STATUS']
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30d' });
}