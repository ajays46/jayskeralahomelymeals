import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


export const generateAccessToken = (userId,role) => {
    return jwt.sign({ userId,role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

export const generateRefreshToken = (userId,role) => {
    return jwt.sign({ userId,role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}