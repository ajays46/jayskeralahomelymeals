const jwt = require('jsonwebtoken');
const { Auth, User } = require('../../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user with auth details
    const user = await User.findOne({
      where: { id: decoded.userId },
      include: [{
        model: Auth,
        as: 'auth',
        attributes: ['email', 'status']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.auth.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
}; 