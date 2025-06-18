import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Auth from '../models/auth.js';
import User from '../models/user.js';
import UserRole from '../models/userRole.js';
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
        console.log("userRole.name", userRole.name);
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

export const forgotPasswordService = async (identifier) => {
    let where = {};
    if (validator.isEmail(identifier)) {
        where.email = identifier;
    } else {
        where.phone_number = identifier;
    }
    const auth = await Auth.findOne({ where });
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
            <p>If you didn’t request this, you can ignore this email.</p>
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
    const auth = await Auth.findByPk(decoded.id);
    if(auth.id !== id){
        throw new AppError('Invalid token', 401);
    }
   
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    auth.password = hashedPassword;
    await auth.save();
    return { success: true, message: 'Password reset successfully' };  
    }
    catch(error){
        console.error('Reset password error:', error);
        throw error;
    }
             
}

export const adminLoginService = async (userId) => {
    const user = await User.findOne({ where:{id:userId}});
    if(!user){  
        throw new AppError('User not found', 404);
    }
    const userRole = await UserRole.findOne({ where:{user_id:userId}});
    if(!userRole){
        throw new AppError('User role not found', 404);
    }
    const auth = await Auth.findOne({ where: { id: user.auth_id } });

    return {
    id: user.id,
    name: user.name,
    email: auth?.email ,
    phone: auth?.phone_number ,
    role: userRole?.name ,
    status: auth?.status 
  };
}
