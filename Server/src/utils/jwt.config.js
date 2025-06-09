import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();



export const generateAccessToken = (authId) => {

    return jwt.sign({ authId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1m' });
}

export const generateRefreshToken = (authId) => {
    return jwt.sign({ authId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}