import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { increaseProductQuantitiesService } from './inventory.service.js';

// Create contact with minimal user account (for sellers)
export const createContactOnly = async ({ firstName, lastName, phoneNumber, sellerId }) => {
  try {
    // Check if phone number already exists in contacts
    const existingContact = await prisma.contact.findFirst({
      where: {
        phoneNumbers: {
          some: {
            number: phoneNumber
          }
        }
      }
    });

    if (existingContact) {
      throw new AppError('This phone number is already registered', 400);
    }

    // First, get the seller's company ID
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { companyId: true }
    });

    if (!seller || !seller.companyId) {
      throw new AppError('Seller must be associated with a company to create contacts', 400);
    }

    // Use a transaction to ensure all records are created together
    const result = await prisma.$transaction(async (tx) => {
      // Generate a unique email for the auth record (required field)
      const timestamp = Date.now();
      const uniqueEmail = `contact_${timestamp}@system.local`;

      // 1. Create a minimal Auth record (required for User)
      const auth = await tx.auth.create({
        data: {
          email: uniqueEmail,
          password: 'NO_PASSWORD_NEEDED', // Placeholder password
          apiKey: `contact_${timestamp}`,
          status: 'ACTIVE'
        }
      });

      // 2. Create a minimal User record linked to the auth, seller, and company
      const user = await tx.user.create({
        data: {
          authId: auth.id,
          status: 'ACTIVE',
          createdBy: sellerId, // Set the seller who created this user
          companyId: seller.companyId // Automatically use seller's company ID
        }
      });

      // 3. Create Contact record linked to the user
      const contact = await tx.contact.create({
        data: {
          userId: user.id,
          firstName,
          lastName
        }
      });

      // 4. Create PhoneNumber record linked to the contact
      const phone = await tx.phoneNumber.create({
        data: {
          contactId: contact.id,
          type: 'PRIMARY',
          number: phoneNumber
        }
      });

              return {
          user: {
            id: user.id,
            status: user.status,
            createdBy: user.createdBy,
            companyId: user.companyId
          },
          contact: {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName
          },
          phoneNumber: {
            id: phone.id,
            type: phone.type,
            number: phone.number
          },
          company: {
            id: seller.companyId
          }
        };
    });

    return result;
  } catch (error) {
    throw new AppError('Failed to create contact: ' + error.message, 500);
  }
};

// Get users created by a specific seller
export const getUsersBySeller = async (sellerId) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        createdBy: sellerId // Filter users created by this specific seller
      },
      include: {
        auth: {
          select: {
            email: true,
            status: true
          }
        },
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
        orders: {
          select: {
            id: true,
            orderDate: true,
            totalPrice: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  } catch (error) {
    throw new AppError('Failed to fetch users by seller: ' + error.message, 500);
  }
};

// Get addresses for a specific user created by a seller
export const getUserAddresses = async (userId, sellerId) => {
  try {
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      }
    });

    if (!user) {
      throw new AppError('User not found or not created by this seller', 404);
    }

    // Get addresses for this user
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return addresses;
  } catch (error) {
    throw new AppError('Failed to fetch user addresses: ' + error.message, 500);
  }
};

// Get orders for a specific user created by a seller
export const getUserOrders = async (userId, sellerId) => {
  try {
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      }
    });

    if (!user) {
      throw new AppError('User not found or not created by this seller', 404);
    }

    // Get orders for this user with related data
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      include: {
        payments: {
          select: {
            id: true,
            paymentMethod: true,
            paymentStatus: true,
            paymentDate: true
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
                pincode: true
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
    throw new AppError('Failed to fetch user orders: ' + error.message, 500);
  }
};

// Create address for a specific user created by a seller
export const createAddressForUser = async (userId, sellerId, addressData) => {
  try {
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      }
    });

    if (!user) {
      throw new AppError('User not found or not created by this seller', 404);
    }

    // Create the address for this user
    const newAddress = await prisma.address.create({
      data: {
        userId: userId,
        street: addressData.street,
        housename: addressData.housename || '',
        city: addressData.city,
        pincode: addressData.pincode,
        geoLocation: addressData.geoLocation || '',
        addressType: addressData.addressType || 'HOME'
      }
    });

    return newAddress;
  } catch (error) {
    throw new AppError('Failed to create address for user: ' + error.message, 500);
  }
};

// Get seller statistics
export const getSellerStats = async (sellerId) => {
  try {
    // This would implement logic to get seller statistics
    // For now, returning placeholder data
    return {
      totalUsersCreated: 0,
      activeUsers: 0,
      totalOrders: 0,
      totalRevenue: 0
    };
  } catch (error) {
    throw new AppError('Failed to fetch seller statistics: ' + error.message, 500);
  }
};

// Validate seller permissions
export const validateSellerPermission = async (sellerId, resourceId) => {
  try {
    // This would implement logic to validate if seller has permission to access a resource
    // For now, returning true (you can implement your permission logic here)
    return true;
  } catch (error) {
    throw new AppError('Failed to validate seller permission: ' + error.message, 500);
  }
};

// Cancel a delivery item
export const cancelDeliveryItem = async (deliveryItemId, sellerId) => {
  try {
    // First verify that this delivery item belongs to an order created by a user of this seller
    const deliveryItem = await prisma.deliveryItem.findFirst({
      where: {
        id: deliveryItemId,
        user: {
          createdBy: sellerId
        }
      },
      include: {
        order: true,
        user: true,
        menuItem: true
      }
    });

    if (!deliveryItem) {
      throw new AppError('Delivery item not found or not accessible by this seller', 404);
    }

    // Check if the delivery item can be cancelled
    if (deliveryItem.status === 'Completed' || deliveryItem.status === 'Cancelled') {
      throw new AppError('Cannot cancel completed or already cancelled delivery items', 400);
    }

    // Update the delivery item status to cancelled
    const updatedDeliveryItem = await prisma.deliveryItem.update({
      where: {
        id: deliveryItemId
      },
      data: {
        status: 'Cancelled',
        updatedAt: new Date()
      }
    });

    // Note: We do NOT restore product quantities for individual delivery item cancellation
    // Product quantities are only restored when the entire order is cancelled

    return updatedDeliveryItem;
  } catch (error) {
    throw new AppError('Failed to cancel delivery item: ' + error.message, 500);
  }
};

// Delete a user and all associated data
export const deleteUser = async (userId, sellerId) => {
  try {
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      },
      include: {
        orders: {
          include: {
            deliveryItems: true,
            payments: {
              include: {
                paymentReceipts: true
              }
            }
          }
        },
        contacts: {
          include: {
            phoneNumbers: true
          }
        },
        addresses: true
      }
    });

    if (!user) {
      throw new AppError('User not found or not accessible by this seller', 404);
    }

    // Check if user has active orders
    const hasActiveOrders = user.orders.some(order => 
      order.status === 'Payment_Confirmed' || order.status === 'In_Progress'
    );

    if (hasActiveOrders) {
      throw new AppError('Cannot delete user with active orders. Please cancel or complete all orders first.', 400);
    }

    // Delete user and all associated data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete delivery items
      for (const order of user.orders) {
        await tx.deliveryItem.deleteMany({
          where: { orderId: order.id }
        });
      }

      // Delete payments
      for (const order of user.orders) {
        await tx.payment.deleteMany({
          where: { orderId: order.id }
        });
      }

      // Delete payment receipts (they are related to payments, not orders)
      for (const order of user.orders) {
        for (const payment of order.payments) {
          await tx.paymentReceipt.deleteMany({
            where: { paymentId: payment.id }
          });
        }
      }

      // Delete orders
      await tx.order.deleteMany({
        where: { userId: userId }
      });

      // Delete addresses
      await tx.address.deleteMany({
        where: { userId: userId }
      });

      // Delete phone numbers
      for (const contact of user.contacts) {
        await tx.phoneNumber.deleteMany({
          where: { contactId: contact.id }
        });
      }

      // Delete contacts
      await tx.contact.deleteMany({
        where: { userId: userId }
      });

      // Delete user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return { success: true, message: 'User and all associated data deleted successfully' };
  } catch (error) {
    throw new AppError('Failed to delete user: ' + error.message, 500);
  }
};
