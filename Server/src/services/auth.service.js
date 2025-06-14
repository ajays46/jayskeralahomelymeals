import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Auth from '../models/auth.js';
import User from '../models/user.js';
import UserRole from '../models/userRole.js';
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
    const now = new Date();

    try {
        console.log('Creating auth record...');
        const auth = await Auth.create({
            email,
            password: hashedPassword,
            phone_number: phone,
            api_key,
            status: 'active',
            created_at: now,
            updated_at: now
        });

        console.log('Auth created with ID:', auth.id);

        console.log('Creating user record...');
        const user = await User.create({
            auth_id: auth.id,
            status: 'active',
            created_at: now,
            updated_at: now
        });

        console.log('User created with ID:', user.id);

        console.log('Creating user role...');
        const userRole = await UserRole.create({
            user_id: user.id,
            name: 'user',
            created_at: now,
            updated_at: now
        });

        console.log('User role created:', userRole);

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
        console.error('Registration error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        
        if (err.name === 'SequelizeValidationError') {
            throw new AppError('Validation error: ' + err.message, 400);
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            throw new AppError('Email or API key already exists', 409);
        }
        throw new AppError('Database error occurred: ' + err.message, 500);
    }
};

export const loginUser = async ({ identifier, password }) => {
    try {
        let where = {};
        if (validator.isEmail(identifier)) {
            where.email = identifier;
        } else {
            where.phone_number = identifier;
        }

        const auth = await Auth.findOne({ where });

        
        if (!auth || !(await bcrypt.compare(password, auth.password))) {
            throw new AppError('Invalid credentials Please try again', 401);
        }

        if (auth.status !== 'active') {
            throw new AppError('Account is not active', 403);
        }

        const user = await User.findOne({ where: { auth_id: auth.id } });
        console.log(user);

        const userRole = await UserRole.findOne({
            where: { user_id: user.id }
        });

        console.log("userRole", userRole);

        if (!user || !userRole) {
            throw new AppError('User or role not found', 404);
        }

        const accessToken = generateAccessToken(user.id, userRole.name);
        const refreshToken = generateRefreshToken(user.id, userRole.name);

        return {
            user: {
                id: user.id,
                email: auth.email,
                phone: auth.phone_number,
                api_key: auth.api_key,
                status: auth.status,
                role: userRole.name
            },
            token: {
                accessToken,
                refreshToken
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};
