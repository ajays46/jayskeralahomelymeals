import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { increaseProductQuantitiesService } from './inventory.service.js';

/**
 * Delivery Manager Service - Handles delivery management operations and analytics
 * Manages delivery routes, executive coordination, and delivery analytics
 * Features: Route management, executive coordination, delivery analytics, order tracking
 */

// Get delivery manager dashboard data
export const getDeliveryManagerDashboardService = async (deliveryManagerId) => {
  try {
    // Get all orders with delivery items for delivery management
    const orders = await prisma.order.findMany({
      include: {
        deliveryItems: {
          include: {
            menuItem: {
              include: {
                product: true,
                menu: true
              }
            },
            deliveryAddress: true,
            user: {
              include: {
                contacts: true
              }
            }
          }
        },
        user: {
          include: {
            contacts: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get delivery executives
    const executives = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            name: 'DELIVERY_EXECUTIVE'
          }
        }
      },
      include: {
        contacts: true
      }
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      order.deliveryItems.some(item => item.status === 'Pending')
    ).length;
    const completedOrders = orders.filter(order => 
      order.deliveryItems.every(item => item.status === 'Completed')
    ).length;
    const cancelledOrders = orders.filter(order => 
      order.deliveryItems.some(item => item.status === 'Cancelled')
    ).length;

    return {
      orders,
      executives,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders
      }
    };
  } catch (error) {
    throw new AppError('Failed to get delivery manager dashboard: ' + error.message, 500);
  }
};

// Cancel a delivery item
export const cancelDeliveryItemService = async (deliveryItemId, deliveryManagerId) => {
  try {
    // Find the delivery item
    const deliveryItem = await prisma.deliveryItem.findUnique({
      where: { id: deliveryItemId },
      include: {
        order: true,
        menuItem: true,
        user: true
      }
    });

    if (!deliveryItem) {
      throw new AppError('Delivery item not found', 404);
    }

    // Check if the delivery item can be cancelled
    if (deliveryItem.status === 'Completed' || deliveryItem.status === 'Cancelled') {
      throw new AppError('Cannot cancel completed or already cancelled delivery items', 400);
    }

    // Update the delivery item status to cancelled
    const updatedDeliveryItem = await prisma.deliveryItem.update({
      where: { id: deliveryItemId },
      data: {
        status: 'Cancelled',
        updatedAt: new Date()
      },
      include: {
        menuItem: {
          include: {
            product: true,
            menu: true
          }
        },
        deliveryAddress: true,
        order: true
      }
    });

    // Note: We do NOT restore product quantities for individual delivery item cancellation
    // Product quantities are only restored when the entire order is cancelled

    return updatedDeliveryItem;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to cancel delivery item: ' + error.message, 500);
  }
};

// Cancel an order
export const cancelOrderService = async (orderId, deliveryManagerId) => {
  try {
    // Find the order with delivery items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if order can be cancelled
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new AppError('Cannot cancel delivered or already cancelled orders', 400);
    }

    // Cancel all delivery items for this order
    await prisma.deliveryItem.updateMany({
      where: { orderId: orderId },
      data: {
        status: 'Cancelled',
        updatedAt: new Date()
      }
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'Cancelled',
        updatedAt: new Date()
      },
      include: {
        deliveryItems: true
      }
    });

    // After successfully cancelling the order, restore product quantities
    try {
      const restorationResult = await increaseProductQuantitiesService(order.deliveryItems);
    } catch (restorationError) {
      console.error('⚠️ Warning: Failed to restore product quantities:', restorationError.message);
      // Don't fail the order cancellation if quantity restoration fails
      // The order is already cancelled, but we log the warning
    }

    return updatedOrder;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to cancel order: ' + error.message, 500);
  }
};

// Update delivery item status
export const updateDeliveryItemStatusService = async (deliveryItemId, deliveryManagerId, status) => {
  try {
    const validStatuses = ['Pending', 'Confirmed', 'In_Progress', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid delivery item status', 400);
    }

    // Find the delivery item
    const deliveryItem = await prisma.deliveryItem.findUnique({
      where: { id: deliveryItemId },
      include: {
        menuItem: {
          include: {
            product: true,
            menu: true
          }
        },
        deliveryAddress: true,
        order: true
      }
    });

    if (!deliveryItem) {
      throw new AppError('Delivery item not found', 404);
    }

    // Update the delivery item status
    const updatedDeliveryItem = await prisma.deliveryItem.update({
      where: { id: deliveryItemId },
      data: { 
        status: status,
        updatedAt: new Date()
      },
      include: {
        menuItem: {
          include: {
            product: true,
            menu: true
          }
        },
        deliveryAddress: true,
        order: true
      }
    });

    return updatedDeliveryItem;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update delivery item status: ' + error.message, 500);
  }
};

// Get delivery executives
export const getDeliveryExecutivesService = async (deliveryManagerId) => {
  try {
    const executives = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            name: 'DELIVERY_EXECUTIVE'
          }
        }
      },
      include: {
        contacts: {
          include: {
            phoneNumbers: true
          }
        },
        userRoles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return executives;
  } catch (error) {
    throw new AppError('Failed to get delivery executives: ' + error.message, 500);
  }
};
