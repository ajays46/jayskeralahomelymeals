const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Auth, User, Company, Session } = require('../../models');
const AuthService = require('../services/auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';

// Helper function to generate token
const generateToken = (user, auth) => {
  return jwt.sign(
    { 
      userId: user.id,
      email: auth.email,
      companyId: user.company_id
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await AuthService.loginService(email, password);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, phone, password, company_name } = req.body;
        
        let result;
        if (company_name) {
            result = await AuthService.registerWithCompanyService(name, email, phone, password, company_name);
        } else {
            result = await AuthService.signupService(name, email, phone, password);
        }
        
        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        await AuthService.logoutService(token);
        
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    login,
    register,
    logout
}; 