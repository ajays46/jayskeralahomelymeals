import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { increaseProductQuantitiesService } from './inventory.service.js';
import { logCritical, logError, logInfo, logTransaction, logPerformance, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import { generateShortToken } from '../utils/helpers.js';
import crypto from 'crypto';

/**
 * Seller Service - Handles seller-specific operations and customer management
 * Manages seller profiles, customer relationships, and seller-specific business logic
 * Features: Customer management, contact creation, seller analytics, order management
 */






// Create contact with minimal user account (for sellers)
export const createContactOnly = async ({ firstName, lastName, phoneNumber, address, sellerId }) => {
  const startTime = Date.now();
  const logContext = {
    firstName,
    lastName,
    phoneNumber,
    sellerId,
    hasAddress: !!address,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Creating contact for seller', logContext);
    
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
      logError(LOG_CATEGORIES.SYSTEM, 'Phone number already registered', {
        ...logContext,
        existingContactId: existingContact.id
      });
      throw new AppError('This phone number is already registered', 400);
    }

    // First, get the seller's company ID
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { companyId: true }
    });

    if (!seller || !seller.companyId) {
      logError(LOG_CATEGORIES.SYSTEM, 'Seller not associated with company', {
        ...logContext,
        sellerCompanyId: seller?.companyId
      });
      throw new AppError('Seller must be associated with a company to create contacts', 400);
    }

    logInfo(LOG_CATEGORIES.SYSTEM, 'Seller company verified', {
      ...logContext,
      companyId: seller.companyId
    });

    // Use a transaction to ensure all records are created together
    const result = await prisma.$transaction(async (tx) => {
      logTransaction('Contact Creation Transaction Started', {
        firstName,
        lastName,
        phoneNumber,
        sellerId,
        companyId: seller.companyId
      });

      // Generate a unique email for the auth record (required field)
      const timestamp = Date.now();
      const uniqueEmail = `contact_${timestamp}@system.local`;

      // 1. Create a minimal Auth record (required for User)
      const auth = await tx.auth.create({
        data: {
          email: uniqueEmail,
          password: 'NO_PASSWORD_NEEDED', // Placeholder password
          apiKey: `contact_${timestamp}`,
          phoneNumber: phoneNumber, // Add phone number to auth record
          status: 'ACTIVE'
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Auth record created for contact', {
        ...logContext,
        authId: auth.id,
        uniqueEmail: uniqueEmail
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

      logInfo(LOG_CATEGORIES.SYSTEM, 'User record created for contact', {
        ...logContext,
        userId: user.id,
        authId: auth.id
      });

      // 3. Create Contact record linked to the user
      const contact = await tx.contact.create({
        data: {
          userId: user.id,
          firstName,
          lastName
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Contact record created', {
        ...logContext,
        contactId: contact.id,
        userId: user.id
      });

      // 4. Create PhoneNumber record linked to the contact
      const phone = await tx.phoneNumber.create({
        data: {
          contactId: contact.id,
          type: 'PRIMARY',
          number: phoneNumber
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Phone number record created', {
        ...logContext,
        phoneId: phone.id,
        contactId: contact.id
      });

      // 5. Create UserRole with "USER" role
      const userRole = await tx.userRole.create({
        data: {
          userId: user.id,
          name: 'USER'
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'User role created for contact', {
        ...logContext,
        roleId: userRole.id,
        userId: user.id
      });

      // 6. Create address if provided - allow Google Maps URL only
      let addressRecord;
      if (address && (address.googleMapsUrl || address.street || address.housename || address.city || address.pincode)) {
        addressRecord = await tx.address.create({
          data: {
            userId: user.id,
            street: address.street || '',
            housename: address.housename || 'Default House', // Required field in schema
            city: address.city || '',
            pincode: address.pincode ? parseInt(address.pincode) : 0, // Convert to integer as per schema
            geoLocation: address.geoLocation || null,
            googleMapsUrl: address.googleMapsUrl || null,
            addressType: 'HOME'
          }
        });

        logInfo(LOG_CATEGORIES.SYSTEM, 'Address record created for contact', {
          ...logContext,
          addressId: addressRecord.id,
          userId: user.id
        });
      }

      const duration = Date.now() - startTime;
      logCritical(LOG_CATEGORIES.SYSTEM, 'Contact creation completed successfully', {
        ...logContext,
        userId: user.id,
        contactId: contact.id,
        phoneId: phone.id,
        addressId: addressRecord?.id,
        duration: `${duration}ms`
      });


      logPerformance('Contact Creation', duration, {
        userId: user.id,
        contactId: contact.id,
        sellerId: sellerId
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
        userRole: {
          id: userRole.id,
          name: userRole.name
        },
        address: addressRecord ? {
          id: addressRecord.id,
          street: addressRecord.street,
          housename: addressRecord.housename,
          city: addressRecord.city,
          pincode: addressRecord.pincode
        } : null,
        company: {
          id: seller.companyId
        }
      };
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 15000, // 15 second timeout for contact creation
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.SYSTEM, 'Contact creation failed', {
      ...logContext,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
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
            createdAt: true,
            payments: {
              select: {
                id: true,
                paymentStatus: true,
                receiptUrl: true,
                paymentMethod: true,
                paymentAmount: true,
                paymentDate: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            pincode: true,
            housename: true,
            addressType: true,
            googleMapsUrl: true,
            geoLocation: true,
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
      select: {
        id: true,
        street: true,
        city: true,
        pincode: true,
        housename: true,
        addressType: true,
        googleMapsUrl: true,
        geoLocation: true,
        createdAt: true,
        updatedAt: true
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
          include: {
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
            deliveryNote: true,
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
                googleMapsUrl: true,
                geoLocation: true
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

// Update delivery note for an order
export const updateOrderDeliveryNote = async (orderId, sellerId, deliveryNote) => {
  try {
    // First verify that the order belongs to a user created by the seller
    const order = await prisma.order.findFirst({
      where: {
        id: orderId
      },
      include: {
        user: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify that the user was created by this seller
    if (order.user.createdBy !== sellerId) {
      throw new AppError('Order not accessible by this seller', 403);
    }

    // Update the delivery note
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        deliveryNote: deliveryNote || null
      }
    });

    return updatedOrder;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update delivery note: ' + error.message, 500);
  }
};

// Update delivery note for delivery items by date
export const updateDeliveryItemsNoteByDate = async (orderId, deliveryDate, sellerId, deliveryNote) => {
  try {
    // First verify that the order belongs to a user created by the seller
    const order = await prisma.order.findFirst({
      where: {
        id: orderId
      },
      include: {
        user: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify that the user was created by this seller
    if (order.user.createdBy !== sellerId) {
      throw new AppError('Order not accessible by this seller', 403);
    }

    // Parse the delivery date
    const dateObj = new Date(deliveryDate);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    // Update all delivery items for this order and date
    const updatedItems = await prisma.deliveryItem.updateMany({
      where: {
        orderId: orderId,
        deliveryDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      data: {
        deliveryNote: deliveryNote || null
      }
    });

    // Get updated delivery items
    const deliveryItems = await prisma.deliveryItem.findMany({
      where: {
        orderId: orderId,
        deliveryDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    return {
      updatedCount: updatedItems.count,
      deliveryItems: deliveryItems
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update delivery items note: ' + error.message, 500);
  }
};

// Update delivery note for delivery items by date range and session
export const updateDeliveryItemsNoteByDateRange = async (orderId, fromDate, toDate, sellerId, deliveryNote, deliveryTimeSlot = null) => {
  try {
    // First verify that the order belongs to a user created by the seller
    const order = await prisma.order.findFirst({
      where: {
        id: orderId
      },
      include: {
        user: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify that the user was created by this seller
    if (order.user.createdBy !== sellerId) {
      throw new AppError('Order not accessible by this seller', 403);
    }

    // Parse the dates
    const fromDateObj = new Date(fromDate);
    fromDateObj.setHours(0, 0, 0, 0);
    const toDateObj = new Date(toDate);
    toDateObj.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause = {
      orderId: orderId,
      deliveryDate: {
        gte: fromDateObj,
        lte: toDateObj
      }
    };

    // Add session filter if provided
    if (deliveryTimeSlot) {
      // Map frontend session names to database values
      const sessionMap = {
        'Breakfast': 'BREAKFAST',
        'Lunch': 'LUNCH',
        'Dinner': 'DINNER',
        'BREAKFAST': 'BREAKFAST',
        'LUNCH': 'LUNCH',
        'DINNER': 'DINNER'
      };
      whereClause.deliveryTimeSlot = sessionMap[deliveryTimeSlot] || deliveryTimeSlot;
    }

    // Update all delivery items matching the criteria
    const updatedItems = await prisma.deliveryItem.updateMany({
      where: whereClause,
      data: {
        deliveryNote: deliveryNote || null
      }
    });

    // Get updated delivery items
    const deliveryItems = await prisma.deliveryItem.findMany({
      where: whereClause
    });

    return {
      updatedCount: updatedItems.count,
      deliveryItems: deliveryItems
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update delivery items note: ' + error.message, 500);
  }
};

// Delete address for a specific user created by a seller
export const deleteAddressForUser = async (userId, addressId, sellerId) => {
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

    // Check if address exists and belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId
      }
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // Delete the address
    await prisma.address.delete({
      where: {
        id: addressId
      }
    });

    return true;
  } catch (error) {
    console.error('Delete address for user service error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete address for user', 500);
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

    // Create the address for this user - handle Google Maps URL only case
    const newAddress = await prisma.address.create({
      data: {
        userId: userId,
        street: addressData.street || '',
        housename: addressData.housename || '',
        city: addressData.city || '',
        pincode: addressData.pincode ? parseInt(addressData.pincode) : 0,
        geoLocation: addressData.geoLocation && addressData.geoLocation.trim() !== '' ? addressData.geoLocation : null,
        googleMapsUrl: addressData.googleMapsUrl && addressData.googleMapsUrl.trim() !== '' ? addressData.googleMapsUrl : null,
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

    // Check if all delivery items in this order are now cancelled
    // If so, automatically cancel the entire order
    const allDeliveryItems = await prisma.deliveryItem.findMany({
      where: {
        orderId: deliveryItem.orderId
      }
    });

    const allCancelled = allDeliveryItems.every(item => item.status === 'Cancelled');
    
    if (allCancelled) {
      // Update order status to cancelled
      await prisma.order.update({
        where: {
          id: deliveryItem.orderId
        },
        data: {
          status: 'Cancelled',
          updatedAt: new Date()
        }
      });
    }

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
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 20000, // 20 second timeout for user deletion
    });

    return { success: true, message: 'User and all associated data deleted successfully' };
  } catch (error) {
    throw new AppError('Failed to delete user: ' + error.message, 500);
  }
};

// Update customer information (for sellers)
export const updateCustomer = async (userId, sellerId, updateData) => {
  try {
    
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      },
      include: {
        contacts: {
          include: {
            phoneNumbers: true
          }
        },
        addresses: true,
        auth: true
      }
    });

    if (!user) {
      throw new AppError('User not found or not accessible by this seller', 404);
    }
    

    // Use a transaction to ensure all updates are done together
    const result = await prisma.$transaction(async (tx) => {
      // Update contact information
      if (updateData.contact) {
        const contact = user.contacts[0];
        if (contact) {
          // Update contact details
          await tx.contact.update({
            where: { id: contact.id },
            data: {
              firstName: updateData.contact.firstName,
              lastName: updateData.contact.lastName
            }
          });

          // Update phone number if provided
          if (updateData.contact.phoneNumbers && updateData.contact.phoneNumbers[0]) {
            const phoneNumber = contact.phoneNumbers[0];
            if (phoneNumber) {
              await tx.phoneNumber.update({
                where: { id: phoneNumber.id },
                data: {
                  number: updateData.contact.phoneNumbers[0].number
                }
              });
            }
          }
        }
      }

      // Update auth information (email)
      if (updateData.auth && updateData.auth.email) {
        await tx.auth.update({
          where: { id: user.auth.id },
          data: {
            email: updateData.auth.email
          }
        });
      }

      // Update address information
      if (updateData.address) {
        const address = user.addresses[0];
        if (address) {
          // Update existing address
          await tx.address.update({
            where: { id: address.id },
            data: {
              street: updateData.address.street,
              housename: updateData.address.housename,
              city: updateData.address.city,
              pincode: parseInt(updateData.address.pincode) || 0,
              geoLocation: updateData.address.geoLocation || null,
              googleMapsUrl: updateData.address.googleMapsUrl || null,
              addressType: updateData.address.addressType || 'HOME'
            }
          });
        } else {
          // Create new address if none exists
          await tx.address.create({
            data: {
              userId: userId,
              street: updateData.address.street,
              housename: updateData.address.housename,
              city: updateData.address.city,
              pincode: parseInt(updateData.address.pincode) || 0,
              geoLocation: updateData.address.geoLocation || null,
              googleMapsUrl: updateData.address.googleMapsUrl || null,
              addressType: updateData.address.addressType || 'HOME'
            }
          });
        }
      }

      // Return updated user data
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        include: {
          contacts: {
            include: {
              phoneNumbers: true
            }
          },
          addresses: true,
          auth: true
        }
      });

      return updatedUser;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 15000, // 15 second timeout for user update
    });

    return result;
  } catch (error) {
    throw new AppError('Failed to update customer: ' + error.message, 500);
  }
};

// Generate customer access link for order status viewing
export const generateCustomerAccessLink = async (userId, sellerId) => {
  try {
    // First verify that this user was created by the seller
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        createdBy: sellerId
      },
      include: {
        contacts: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found or not accessible by this seller', 404);
    }

    // Generate short token (8 characters)
    let shortToken = generateShortToken();
    
    // Ensure uniqueness (retry if token already exists)
    let tokenExists = true;
    let retries = 0;
    while (tokenExists && retries < 5) {
      const existing = await prisma.customerPortalToken.findUnique({
        where: { shortToken }
      });
      if (!existing) {
        tokenExists = false;
      } else {
        shortToken = generateShortToken();
        retries++;
      }
    }

    if (tokenExists) {
      throw new AppError('Failed to generate unique token. Please try again.', 500);
    }

    // Set expiration to 24 hours (86400000 ms)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store short token in database
    await prisma.customerPortalToken.create({
      data: {
        shortToken,
        userId,
        expiresAt
      }
    });
    
    // Create the customer portal URL with short token
    const baseUrl = process.env.FRONTEND_PROD_URL 
    const customerPortalUrl = `${baseUrl}/customer-portal?t=${shortToken}`;

    logInfo(LOG_CATEGORIES.SYSTEM, 'Customer access link generated', {
      userId: userId,
      sellerId: sellerId,
      shortToken: shortToken,
      customerName: user.contacts?.[0] ? `${user.contacts[0].firstName} ${user.contacts[0].lastName}` : 'Unknown'
    });

    return {
      success: true,
      customerPortalUrl: customerPortalUrl,
      token: shortToken,
      expiresIn: '24 hours',
      customerName: user.contacts?.[0] ? `${user.contacts[0].firstName} ${user.contacts[0].lastName}` : 'Unknown Customer',
      securityNote: 'Token is automatically hidden from URL for security'
    };
  } catch (error) {
    throw new AppError('Failed to generate customer access link: ' + error.message, 500);
  }
};
