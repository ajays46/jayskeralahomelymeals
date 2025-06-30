import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { generateApiKey } from '../utils/helpers.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.config.js';
import nodemailer from 'nodemailer';
dotenv.config();

export const registerUser = async ({ email, password, phone }) => {
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const existingAuth = await prisma.auth.findUnique({ 
        where: { email } 
    });
    if (existingAuth) {
        throw new AppError('Email already registered', 409);
    }

    const existingPhone = await prisma.auth.findFirst({ 
        where: { phoneNumber: phone } 
    });
    if (existingPhone) {
        throw new AppError('This phone number is already registered. Please login instead.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const api_key = generateApiKey();

    try {
        console.log('Creating auth record...');
        const auth = await prisma.auth.create({
            data: {
                email,
                password: hashedPassword,
                phoneNumber: phone,
                apiKey: api_key,
                status: 'ACTIVE'
            }
        });

        console.log('Auth created with ID:', auth.id);

        console.log('Creating user record...');
        const user = await prisma.user.create({
            data: {
                authId: auth.id,
                status: 'ACTIVE'
            }
        });

        console.log('User created with ID:', user.id);

        console.log('Creating user role...');
        const userRole = await prisma.userRole.create({
            data: {
                userId: user.id,
                name: 'USER'
            }
        });

        console.log('User role created:', userRole);

        return {
            id: auth.id,
            email: auth.email,
            phone_number: auth.phoneNumber,
            api_key: auth.apiKey,
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
        
        if (err.code === 'P2002') {
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
            where.phoneNumber = identifier;
        }

        const auth = await prisma.auth.findFirst({ where });

        if (!auth || !(await bcrypt.compare(password, auth.password))) {
            throw new AppError('Invalid credentials Please try again', 401);
        }

        if (auth.status !== 'ACTIVE') {
            throw new AppError('Account is not active', 403);
        }

        const user = await prisma.user.findUnique({ 
            where: { authId: auth.id },
            include: {
                userRole: true
            }
        });
        console.log(user);

        if (!user || !user.userRole) {
            throw new AppError('User or role not found', 404);
        }
        console.log("userRole.name", user.userRole.name);
        const accessToken = generateAccessToken(user.id, user.userRole.name);
        const refreshToken = generateRefreshToken(user.id, user.userRole.name);

        return {
            user: {
                id: user.id,
                email: auth.email,
                phone: auth.phoneNumber,
                api_key: auth.apiKey,
                status: auth.status,
                role: user.userRole.name
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

export const forgotPasswordService = async (identifier) => {
    let where = {};
    if (validator.isEmail(identifier)) {
        where.email = identifier;
    } else {
        where.phoneNumber = identifier;
    }
    const auth = await prisma.auth.findFirst({ where });
    console.log(auth, "auth");
    
    if (!auth) {
        throw new AppError('No user found with this email or phone number', 404);
    }

    const token = jwt.sign({ id: auth.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });
    

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user:process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: '"Jay\'s Kerala Enterprises" <ajay.g@jayskeralaenterprises.com>',
        to: auth.email,
        subject: 'Reset Your Password',
        html: `
            <p>Hello,</p>
            <p>You requested a password reset. Please click the link below to reset your password:</p>
            <a href="http://localhost:5173/reset-password/${token}/${auth.id}">
                Reset Password
            </a>
            <p>If you didn't request this, you can ignore this email.</p>
        `    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    return { success: true, message: 'If an account exists, a reset link has been sent.' };
};

export const resetPasswordService = async (token, id, newPassword) => {
    try{
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.id !== id) {
        throw new AppError('Invalid token', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const auth = await prisma.auth.update({
        where: { id },
        data: { password: hashedPassword }
    });

    if (!auth) {
        throw new AppError('User not found', 404);
    }

    return { success: true, message: 'Password reset successful' };
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired', 401);
        }
        throw error;
    }
};

export const adminLoginService = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                auth: true,
                userRole: true
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.userRole.name !== 'ADMIN') {
            throw new AppError('Access denied. Admin privileges required.', 403);
        }

        if (user.status !== 'ACTIVE') {
            throw new AppError('User account is not active', 403);
        }

        if (user.auth.status !== 'ACTIVE') {
            throw new AppError('Auth account is not active', 403);
        }

        const accessToken = generateAccessToken(user.id, user.userRole.name);
        const refreshToken = generateRefreshToken(user.id, user.userRole.name);

        return {
            user: {
                id: user.id,
                email: user.auth.email,
                phone: user.auth.phoneNumber,
                api_key: user.auth.apiKey,
                status: user.auth.status,
                role: user.userRole.name
            },
            token: {
                accessToken,
                refreshToken
            }
        };
    } catch (error) {
        console.error('Admin login error:', error);
        throw error;
    }
};
