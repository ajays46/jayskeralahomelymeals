const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Auth, User, Company, Session } = require('../../models');
const { sequelize } = require('../../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';

class AuthService {
  // Helper function to generate token
  static generateToken(user, auth) {
    return jwt.sign(
      { 
        userId: user.id,
        email: auth.email,
        companyId: user.company_id
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }

  // Helper function to check email existence
  static async checkEmailExists(email) {
    const existingAuth = await Auth.findOne({ where: { email } });
    return !!existingAuth;
  }

  // Signup service
  static async signupService(name, email, phone, password) {
    try {
      // Check if user already exists
      const emailExists = await this.checkEmailExists(email);
      if (emailExists) {
        throw new Error('Email already registered');
      }

      // Validate phone number
      if (!phone) {
        throw new Error('Phone number is required');
      }

      // Generate API key
      const api_key = uuidv4();

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create auth record
      const auth = await Auth.create({
        id: uuidv4(),
        email,
        password: hashedPassword,
        phone_number: phone || '',
        api_key,
        status: 'active'
      });

      // Get the default user role
      const [userRole] = await sequelize.query(
        'SELECT id FROM roles WHERE name = "user" LIMIT 1'
      );

      if (!userRole || !userRole[0]) {
        throw new Error('Default user role not found');
      }

      // Create user record
      const user = await User.create({
        id: uuidv4(),
        auth_id: auth.id,
        role_id: userRole[0].id,
        name: name,
        status: 'active'
      });

      // Generate token
      const token = this.generateToken(user, auth);

      // Create session
      await Session.create({
        id: uuidv4(),
        user_id: user.id,
        access_token: token
      });

      return {
        user_id: user.id,
        name: user.name,
        email: auth.email,
        phone_number: auth.phone_number,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Login service
  static async loginService(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find auth record
      const auth = await Auth.findOne({ where: { email } });
      if (!auth) {
        throw new Error('Invalid email or password');
      }

      // Check if account is active
      if (auth.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, auth.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Find user record
      const user = await User.findOne({
        where: { auth_id: auth.id },
        include: [
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate token
      const token = this.generateToken(user, auth);

      // Create or update session
      await Session.create({
        id: uuidv4(),
        user_id: user.id,
        access_token: token
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: auth.email,
          phone_number: auth.phone_number,
          company: user.company ? {
            id: user.company.id,
            name: user.company.name
          } : null
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout service
  // static async logoutService(token) {
  //   try {
  //     if (!token) {
  //       throw new Error('Token is required');
  //     }

  //     const result = await Session.destroy({
  //       where: { access_token: token }
  //     });

  //     if (!result) {
  //       throw new Error('Session not found');
  //     }

  //     return true;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // Register with company service
  static async registerWithCompanyService(name, email, phone, password, company_name) {
    try {
      // Validate required fields
      if (!name) {
        throw new Error('Name is required');
      }
      if (!email) {
        throw new Error('Email is required');
      }
      if (!phone) {
        throw new Error('Phone number is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }
      if (!company_name) {
        throw new Error('Company name is required');
      }

      // Check if user already exists
      const emailExists = await this.checkEmailExists(email);
      if (emailExists) {
        throw new Error('Email already registered');
      }

      // Generate API key
      const api_key = uuidv4();

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create auth record
      const auth = await Auth.create({
        id: uuidv4(),
        email,
        password: hashedPassword,
        phone_number: phone || '',
        api_key,
        status: 'active'
      });

      // Create company
      const company = await Company.create({
        id: uuidv4(),
        name: company_name,
        status: 'active'
      });

      // Get the default user role
      const [userRole] = await sequelize.query(
        'SELECT id FROM roles WHERE name = "user" LIMIT 1'
      );

      if (!userRole || !userRole[0]) {
        throw new Error('Default user role not found');
      }

      // Create user record with explicit name field
      const user = await User.create({
        id: uuidv4(),
        auth_id: auth.id,
        company_id: company.id,
        role_id: userRole[0].id,
        name: name.trim(), // Ensure name is trimmed
        status: 'active'
      });

      // Generate token
      const token = this.generateToken(user, auth);

      // Create session
      await Session.create({
        id: uuidv4(),
        user_id: user.id,
        access_token: token
      });

      return {
        user_id: user.id,
        name: user.name,
        email: auth.email,
        phone_number: auth.phone_number,
        company_id: company.id,
        company_name: company.name,
        token
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthService; 