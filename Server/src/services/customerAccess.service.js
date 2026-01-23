import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * Customer Access Service - Handles customer portal access and data retrieval
 * Provides read-only access to customer order information and status
 * Features: Token validation, order status viewing, delivery tracking
 */

// Validate customer access token (supports both short tokens and legacy JWT tokens)
export const validateCustomerToken = async (token) => {
  try {
    // Check if token is a short token (8 characters) or JWT (longer)
    const isShortToken = token.length <= 20 && !token.includes('.');

    if (isShortToken) {
      // Validate short token from database
      const tokenRecord = await prisma.customerPortalToken.findUnique({
        where: { shortToken: token },
        include: {
          user: {
            include: {
              contacts: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumbers: {
                    select: {
                      number: true,
                      type: true
                    }
                  }
                }
              },
              auth: {
                select: {
                  email: true,
                  status: true,
                  password: true,
                  phoneNumber: true
                }
              }
            }
          }
        }
      });

      if (!tokenRecord) {
        throw new AppError('Invalid access link', 401);
      }

      // Check if token has expired
      if (new Date() > new Date(tokenRecord.expiresAt)) {
        // Delete expired token
        await prisma.customerPortalToken.delete({
          where: { id: tokenRecord.id }
        });
        throw new AppError('Access link has expired (24 hours). Please request a new link from your seller.', 401);
      }

      const user = tokenRecord.user;

      if (!user || user.status !== 'ACTIVE' || user.auth.status !== 'ACTIVE') {
        throw new AppError('User not found or inactive', 401);
      }

      // Mark token as used (optional - you can keep it for multiple uses or delete it)
      // For now, we'll keep it until expiration for better UX

      return {
        userId: user.id,
        customerName: user.contacts?.[0] ? `${user.contacts[0].firstName} ${user.contacts[0].lastName}` : 'Customer',
        phoneNumber: user.contacts?.[0]?.phoneNumbers?.[0]?.number || user.auth.phoneNumber || null,
        email: user.auth.email,
        needsPasswordSetup: user.auth.password === 'NO_PASSWORD_NEEDED'
      };
    } else {
      // Legacy JWT token support (for backward compatibility)
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      if (decoded.type !== 'CUSTOMER_ACCESS') {
        throw new AppError('Invalid token type', 401);
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          contacts: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumbers: {
                select: {
                  number: true,
                  type: true
                }
              }
            }
          },
          auth: {
            select: {
              email: true,
              status: true,
              password: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!user || user.status !== 'ACTIVE' || user.auth.status !== 'ACTIVE') {
        throw new AppError('User not found or inactive', 401);
      }

      return {
        userId: user.id,
        customerName: user.contacts?.[0] ? `${user.contacts[0].firstName} ${user.contacts[0].lastName}` : 'Customer',
        phoneNumber: user.contacts?.[0]?.phoneNumbers?.[0]?.number || user.auth.phoneNumber || null,
        email: user.auth.email,
        needsPasswordSetup: user.auth.password === 'NO_PASSWORD_NEEDED'
      };
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access link has expired. Please request a new link from your seller.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid access link', 401);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Token validation failed: ' + error.message, 401);
  }
};

// Setup customer password (supports both short tokens and legacy JWT tokens)
export const setupCustomerPassword = async (token, password) => {
  try {
    // Check if token is a short token (8 characters) or JWT (longer)
    const isShortToken = token.length <= 20 && !token.includes('.');

    let userId;

    if (isShortToken) {
      // Validate short token from database
      const tokenRecord = await prisma.customerPortalToken.findUnique({
        where: { shortToken: token },
        include: {
          user: {
            include: {
              auth: {
                select: {
                  id: true,
                  password: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!tokenRecord) {
        throw new AppError('Invalid access link', 401);
      }

      // Check if token has expired
      if (new Date() > new Date(tokenRecord.expiresAt)) {
        // Delete expired token
        await prisma.customerPortalToken.delete({
          where: { id: tokenRecord.id }
        });
        throw new AppError('Access link has expired (24 hours). Please request a new link.', 401);
      }

      userId = tokenRecord.userId;
    } else {
      // Legacy JWT token support (for backward compatibility)
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      if (decoded.type !== 'CUSTOMER_ACCESS') {
        throw new AppError('Invalid token type', 401);
      }

      userId = decoded.userId;
    }

    // Get user with auth info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        auth: {
          select: {
            id: true,
            password: true,
            email: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if password is already set
    if (user.auth.password !== 'NO_PASSWORD_NEEDED') {
      throw new AppError('Password already set up', 400);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password
    await prisma.auth.update({
      where: { id: user.auth.id },
      data: { password: hashedPassword }
    });

    return {
      success: true,
      message: 'Password set successfully'
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access link has expired. Please request a new link.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid access link', 401);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to setup password: ' + error.message, 500);
  }
};

// Get customer orders for portal
export const getCustomerOrders = async (userId) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      include: {
        payments: {
          select: {
            id: true,
            paymentStatus: true,
            paymentAmount: true,
            paymentDate: true,
            paymentMethod: true,
            receiptUrl: true,
            paymentReceipts: {
              select: {
                id: true,
                receiptImageUrl: true,
                receipt: true
              }
            }
          }
        },
        deliveryItems: {
          select: {
            id: true,
            deliveryDate: true,
            deliveryTimeSlot: true,
            status: true,
            quantity: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                menu: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            deliveryAddress: {
              select: {
                id: true,
                street: true,
                housename: true,
                city: true,
                pincode: true,
                googleMapsUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders;
  } catch (error) {
    throw new AppError('Failed to fetch customer orders: ' + error.message, 500);
  }
};

// Get customer addresses
export const getCustomerAddresses = async (userId) => {
  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        street: true,
        city: true,
        pincode: true,
        housename: true,
        addressType: true,
        googleMapsUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return addresses;
  } catch (error) {
    throw new AppError('Failed to fetch customer addresses: ' + error.message, 500);
  }
};

// Get customer order summary
export const getCustomerOrderSummary = async (userId) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        orderDate: true,
        createdAt: true
      }
    });

    const summary = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
      activeOrders: orders.filter(order => 
        order.status === 'Payment_Confirmed' || order.status === 'In_Progress'
      ).length,
      completedOrders: orders.filter(order => order.status === 'Completed').length,
      cancelledOrders: orders.filter(order => order.status === 'Cancelled').length,
      recentOrders: orders.slice(0, 5) // Last 5 orders
    };

    return summary;
  } catch (error) {
    throw new AppError('Failed to fetch customer order summary: ' + error.message, 500);
  }
};
