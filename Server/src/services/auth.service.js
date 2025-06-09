import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Auth from '../models/auth.js';
import User from '../models/user.js';
import AppError from '../utils/AppError.js';
import { generateApiKey } from '../utils/helpers.js';
import validator from 'validator';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.config.js';

dotenv.config();

export const registerUser = async ({ email, password, phone }) => {
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const existingAuth = await Auth.findOne({ where: { email } });
    if (existingAuth) {
        throw new AppError('Email already registered', 409);
    }

    const existingPhone = await Auth.findOne({ where: { phone_number: phone } });
    if (existingPhone) {
        throw new AppError('This phone number is already registered. Please login instead.', 400);
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const api_key = generateApiKey();

    try {
        const auth = await Auth.create({
            email,
            password: hashedPassword,
            phone_number: phone,
            api_key,
            status: 'active'
        });

        console.log('auth.id:', auth.id);

        const user = await User.create({
            auth_id: auth.id,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
        });

        return {
            id: auth.id,
            email: auth.email,
            phone_number: auth.phone_number,
            api_key: auth.api_key,
            status: auth.status,
            user_id: user.id,
            user_status: user.status
        };

    } catch (err) {
        console.error('User creation error:', err);
        if (err.name === 'SequelizeValidationError') {
            throw new AppError('Validation error: ' + err.message, 400);
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            throw new AppError('Email or API key already exists', 409);
        }
        throw new AppError('Database error occurred', 500);
    }
};

export const loginUser = async ({ identifier, password }) => {
    let where = {};
    if (validator.isEmail(identifier)) {
        where.email = identifier;
    } else {
        where.phone_number = identifier;
    }

    const auth = await Auth.findOne({ where });

    if (!auth || !(await bcrypt.compare(password, auth.password))) {
        throw new AppError('Invalid credentials', 401);
    }

    if (auth.status !== 'active') {
        throw new AppError('Account is not active', 403);
    }

    const accessToken = generateAccessToken(auth.id);
    const refreshToken = generateRefreshToken(auth.id);

    return {
        user: {
            id: auth.id,
            email: auth.email,
            phone: auth.phone_number,
            api_key: auth.api_key,
            status: auth.status,
        },
        token: {
            accessToken,
            refreshToken
        }
    };
};

// export const refreshTokenUser = async (refreshToken) => {               
//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//     const auth = await Auth.findByPk(decoded.authId);
//     if (!auth) {
//         throw new AppError('Invalid refresh token', 401);
//     }
//     const newAccessToken = generateAccessToken(auth.id);
//     const newRefreshToken = generateRefreshToken(auth.id);
//     return { accessToken:newAccessToken, refreshToken:newRefreshToken };
// };