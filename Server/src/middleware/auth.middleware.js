const { verifyAccessToken } = require('../config/jwt.config');
const { User, Auth } = require('../models');

exports.verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Access token not found'
      });
    }

    // Verify access token
    const decoded = verifyAccessToken(accessToken);
    
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
    req.user = {
      userId: user.id,
      email: user.auth.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}; 