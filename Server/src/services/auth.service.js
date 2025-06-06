import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Auth from '../models/auth.js';
import AppError from '../utils/AppError.js';
import { generateApiKey } from '../utils/helpers.js';

dotenv.config();

export const registerUser = async ({ email, password, phone }) => {
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const existingAuth = await Auth.findOne({ where: { email } });
    if (existingAuth) {
        throw new AppError('Email already registered', 409);
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

        return {
            id: auth.id,
            email: auth.email,
            phone_number: auth.phone_number,
            api_key: auth.api_key,
            status: auth.status
        };
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            throw new AppError('Validation error: ' + err.message, 400);
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            throw new AppError('Email or API key already exists', 409);
        }
        throw new AppError('Database error occurred', 500);
    }
};

export const loginUser = async ({ email, password }) => {
    const auth = await Auth.findOne({ where: { email } });

    if (!auth || !(await bcrypt.compare(password, auth.password))) {
        throw new AppError('Invalid credentials', 401);
    }

    if (auth.status !== 'active') {
        throw new AppError('Account is not active', 403);
    }

    return {
        user: {
            id: auth.id,
            email: auth.email,
            phone: auth.phone_number,
            api_key: auth.api_key,
            status: auth.status
        }
    };
};
