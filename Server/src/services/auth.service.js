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
        // Get the next customer ID
        const lastUser = await prisma.user.findFirst({
            orderBy: { customerId: 'desc' }
        });
        const nextCustomerId = lastUser ? lastUser.customerId + 1 : 1;

        const auth = await prisma.auth.create({
            data: {
                email,
                password: hashedPassword,
                phoneNumber: phone,
                apiKey: api_key,
                status: 'ACTIVE'
            }
        });

        const user = await prisma.user.create({
            data: {
                customerId: nextCustomerId,
                authId: auth.id,
                status: 'ACTIVE'
            }
        });

        const userRole = await prisma.userRole.create({
            data: {
                userId: user.id,
                name: 'USER'
            }
        });

        return {
            id: auth.id,
            email: auth.email,
            phone_number: auth.phoneNumber,
            api_key: auth.apiKey,
            status: auth.status,
            user_id: user.id,
            customer_id: user.customerId,
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
                userRoles: true
            }
        });

        if (!user || !user.userRoles || user.userRoles.length === 0) {
            throw new AppError('User or roles not found', 404);
        }

        // Get the primary role (first role or highest priority role)
        const primaryRole = user.userRoles[0];
        const accessToken = generateAccessToken(user.id, primaryRole.name);
        const refreshToken = generateRefreshToken(user.id, primaryRole.name);

        return {
            user: {
                id: user.id,
                customer_id: user.customerId,
                email: auth.email,
                phone: auth.phoneNumber,
                api_key: auth.apiKey,
                status: auth.status,
                role: primaryRole.name,
                roles: user.userRoles.map(role => role.name) // Include all roles
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
            <a href="${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL}/reset-password/${token}/${auth.id}">
                Reset Password
            </a>
            <p>If you didn't request this, you can ignore this email.</p>
        `    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            // Email sending failed
        } else {
            // Email sent successfully
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
                userRoles: true
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return {
            id: user.id,
            customer_id: user.customerId,
            email: user.auth.email,
            phone: user.auth.phoneNumber,
            status: user.auth.status,
            roles: user.userRoles.map(role => role.name)
        };
    } catch (error) {
        console.error('Admin login service error:', error);
        throw error;
    }
};

// Add a role to a user
export const addUserRole = async (userId, roleName) => {
    try {
        const existingRole = await prisma.userRole.findFirst({
            where: {
                userId: userId,
                name: roleName
            }
        });

        if (existingRole) {
            throw new AppError('User already has this role', 409);
        }

        const userRole = await prisma.userRole.create({
            data: {
                userId: userId,
                name: roleName
            }
        });

        return userRole;
    } catch (error) {
        console.error('Add user role error:', error);
        throw error;
    }
};

// Remove a role from a user
export const removeUserRole = async (userId, roleName) => {
    try {
        const userRole = await prisma.userRole.findFirst({
            where: {
                userId: userId,
                name: roleName
            }
        });

        if (!userRole) {
            throw new AppError('User does not have this role', 404);
        }

        // Prevent removing the last USER role
        if (roleName === 'USER') {
            const userRoles = await prisma.userRole.findMany({
                where: { userId: userId }
            });
            
            if (userRoles.length === 1) {
                throw new AppError('Cannot remove the last USER role', 400);
            }
        }

        await prisma.userRole.delete({
            where: { id: userRole.id }
        });

        return { message: 'Role removed successfully' };
    } catch (error) {
        console.error('Remove user role error:', error);
        throw error;
    }
};

// Get all roles for a user
export const getUserRoles = async (userId) => {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'asc' }
        });

        return userRoles.map(role => role.name);
    } catch (error) {
        console.error('Get user roles error:', error);
        throw error;
    }
};

// Check if user has a specific role
export const hasRole = async (userId, roleName) => {
    try {
        const userRole = await prisma.userRole.findFirst({
            where: {
                userId: userId,
                name: roleName
            }
        });

        return !!userRole;
    } catch (error) {
        console.error('Check user role error:', error);
        throw error;
    }
};
